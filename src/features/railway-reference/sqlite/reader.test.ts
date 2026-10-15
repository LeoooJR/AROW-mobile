import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import {
  readMilestoneRow,
  readRailwayMilestoneBoundRows,
  readSearchableRailwayRows,
} from "./reader";
import {
  FIND_MILESTONE_QUERY,
  FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
} from "./queries";

const section = new RailwaySectionId("893000", 2);
const lookup = new MilestoneId(section, 509_000);

test("returns searchable rows unchanged without validating or assembling them", async () => {
  const rows = [{ unrecognised: true }, null];
  const getAllAsync = jest.fn().mockResolvedValue(rows);

  expect(await readSearchableRailwayRows({ getAllAsync })).toBe(rows);
  expect(getAllAsync).toHaveBeenCalledWith(LOAD_SEARCHABLE_RAILWAYS_QUERY);
});

test("binds the exact point identity and returns the raw row unchanged", async () => {
  const row = { unrecognised: true };
  const getFirstAsync = jest.fn().mockResolvedValue(row);

  expect(await readMilestoneRow({ getFirstAsync }, lookup)).toBe(row);
  expect(getFirstAsync).toHaveBeenCalledWith(
    FIND_MILESTONE_QUERY,
    "893000",
    2,
    509_000,
  );
});

test("preserves null when no exact point exists", async () => {
  expect(
    await readMilestoneRow(
      { getFirstAsync: jest.fn().mockResolvedValue(null) },
      lookup,
    ),
  ).toBeNull();
});

test("binds the same section to every bounds subquery and preserves row order", async () => {
  const rows = [{ position_m: 99_000 }, { position_m: 100_000 }];
  const getAllAsync = jest.fn().mockResolvedValue(rows);

  expect(await readRailwayMilestoneBoundRows({ getAllAsync }, section)).toBe(
    rows,
  );
  expect(getAllAsync).toHaveBeenCalledWith(
    FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
    "893000",
    2,
    "893000",
    2,
    "893000",
    2,
  );
});

test("preserves empty collection results", async () => {
  const rows: unknown[] = [];
  const database = { getAllAsync: jest.fn().mockResolvedValue(rows) };
  expect(await readSearchableRailwayRows(database)).toBe(rows);
  expect(await readRailwayMilestoneBoundRows(database, section)).toBe(rows);
});

test("propagates query failures without replacing the database error", async () => {
  const error = new Error("database unavailable");
  const database = {
    getAllAsync: jest.fn().mockRejectedValue(error),
    getFirstAsync: jest.fn().mockRejectedValue(error),
  };
  await expect(readSearchableRailwayRows(database)).rejects.toBe(error);
  await expect(readMilestoneRow(database, lookup)).rejects.toBe(error);
  await expect(readRailwayMilestoneBoundRows(database, section)).rejects.toBe(
    error,
  );
});
