/** @jest-environment node */
import { DatabaseSync } from "node:sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { findMilestoneNeighbours } from "./repository";
import {
  readPreviousMilestoneRow,
  readNextMilestoneRow,
  readCurrentMilestoneRow,
} from "./sqlite/reader";
import {
  FIND_PREVIOUS_MILESTONE_QUERY,
  FIND_NEXT_MILESTONE_QUERY,
  FIND_CURRENT_MILESTONE_QUERY,
} from "./sqlite/queries";
import { milestoneRowsToNeighbours } from "./mapping/milestone-neighbours-mapper";

const id = (position: number, rank = 1, code = "001000") =>
  new MilestoneId(new RailwaySectionId(code, rank), position);

test.each([
  ["previous", readPreviousMilestoneRow, FIND_PREVIOUS_MILESTONE_QUERY],
  ["next", readNextMilestoneRow, FIND_NEXT_MILESTONE_QUERY],
  ["current", readCurrentMilestoneRow, FIND_CURRENT_MILESTONE_QUERY],
] as const)(
  "binds canonical identity and passes raw %s results through",
  async (_name, readRow, query) => {
    const raw = { untrusted: true };
    const getFirstAsync = jest
      .fn()
      .mockResolvedValueOnce(raw)
      .mockResolvedValueOnce(null)
      .mockRejectedValueOnce(new Error("database unavailable"));
    const source = { getFirstAsync };
    expect(await readRow(source, id(99000))).toBe(raw);
    expect(getFirstAsync).toHaveBeenCalledWith(query, "001000", 1, 99000);
    expect(await readRow(source, id(99000))).toBeNull();
    await expect(readRow(source, id(99000))).rejects.toThrow(
      "database unavailable",
    );
  },
);

test("numeric adjacency skips gaps, isolates sections and lines, and counts only recorded PKs", async () => {
  const database = new DatabaseSync(":memory:");
  database.exec(
    "CREATE TABLE kilometric_points (code_ligne TEXT, rg_troncon INTEGER, position_m INTEGER, label TEXT, latitude REAL, longitude REAL, position_in_section INTEGER, PRIMARY KEY (code_ligne, rg_troncon, position_m))",
  );
  database.exec(
    "CREATE TABLE railway_sections (code_ligne TEXT, rg_troncon INTEGER, milestone_count INTEGER, PRIMARY KEY (code_ligne, rg_troncon))",
  );
  database.exec(
    "INSERT INTO railway_sections VALUES ('001000',1,3), ('001000',2,1), ('002000',1,1)",
  );
  database.exec(`INSERT INTO kilometric_points VALUES
    ('001000',1,99000,'99+000',45,4,1),
    ('001000',1,100000,'100+000',46,5,2),
    ('001000',1,150000,'150+000',47,6,3),
    ('001000',2,100000,'100+000',48,7,1),
    ('002000',1,99500,'99+500',49,8,1)`);
  const source: Pick<SQLiteDatabase, "getFirstAsync"> = {
    getFirstAsync: jest
      .fn()
      .mockImplementation(
        async (sql: string, ...bindings: (number | string)[]) =>
          database.prepare(sql).get(...bindings) ?? null,
      ),
  };
  try {
    const middle = await findMilestoneNeighbours(source, id(100000));
    expect(middle).toMatchObject({ positionInSection: 2, total: 3 });
    expect(middle?.current.id.value).toBe("001000:1:100000");
    expect(middle?.current.label).toBe("100+000");
    expect(middle?.current.coordinates).toEqual({ latitude: 46, longitude: 5 });
    expect(middle?.previous?.id.value).toBe("001000:1:99000");
    expect(middle?.next?.label).toBe("150+000");
    expect(middle?.next?.coordinates).toEqual({ latitude: 47, longitude: 6 });
    expect(await findMilestoneNeighbours(source, id(99000))).toMatchObject({
      positionInSection: 1,
      total: 3,
      previous: undefined,
    });
    expect(await findMilestoneNeighbours(source, id(150000))).toMatchObject({
      positionInSection: 3,
      total: 3,
      next: undefined,
    });
    expect(await findMilestoneNeighbours(source, id(100000, 2))).toMatchObject({
      positionInSection: 1,
      total: 1,
      previous: undefined,
      next: undefined,
    });
    expect(await findMilestoneNeighbours(source, id(99500))).toBeUndefined();
    expect(await findMilestoneNeighbours(source, id(0, 3))).toBeUndefined();
    database.exec(
      "UPDATE kilometric_points SET latitude=100 WHERE position_m=150000",
    );
    await expect(findMilestoneNeighbours(source, id(100000))).rejects.toThrow(
      /next milestone result/,
    );
    await expect(findMilestoneNeighbours(source, id(150000))).rejects.toThrow(
      /current milestone result/,
    );
    database.exec("DROP TABLE kilometric_points");
    await expect(findMilestoneNeighbours(source, id(100000))).rejects.toThrow();
  } finally {
    database.close();
  }
});

test.each([
  {},
  { position_in_section: 0, total: 1 },
  { position_in_section: 2, total: 1 },
  { position_in_section: 1.5, total: 3 },
  { position_in_section: 1, total: Infinity },
])("rejects malformed section position metadata %p", (raw) => {
  expect(() => milestoneRowsToNeighbours(raw, null, null)).toThrow(
    "Milestone section position result is invalid",
  );
});

test("missing current records do not map unrelated neighbours", () => {
  expect(milestoneRowsToNeighbours(null, {}, {})).toBeUndefined();
  expect(() =>
    milestoneRowsToNeighbours(
      {
        code_ligne: "001000",
        rg_troncon: 1,
        position_m: 100000,
        label: "100+000",
        latitude: 46,
        longitude: 5,
        position_in_section: 2,
        total: 3,
      },
      {},
      null,
    ),
  ).toThrow(/previous milestone result/);
});
