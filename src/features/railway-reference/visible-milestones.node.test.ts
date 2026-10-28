/** @jest-environment node */
import { DatabaseSync } from "node:sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import { findVisibleMilestones } from "./repository";
import { milestoneVisibilityClassForPosition } from "@shared/railway-reference/milestone-visibility-class";
import { milestoneFromDatabaseRow } from "./mapping/milestone-mapper";

test("viewport SQL includes boundary points and both sides of the antimeridian", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(
      "CREATE TABLE kilometric_points(code_ligne TEXT, rg_troncon INTEGER, position_m INTEGER, label TEXT, latitude REAL, longitude REAL, position_in_section INTEGER, visibility_class INTEGER)",
    );
    const statement = database.prepare(
      "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insert = {
      run: (
        code: string,
        rank: number,
        position: number,
        label: string,
        latitude: number,
        longitude: number,
        ordinal: number,
      ) =>
        statement.run(
          code,
          rank,
          position,
          label,
          latitude,
          longitude,
          ordinal,
          milestoneVisibilityClassForPosition(position),
        ),
    };
    insert.run("001000", 1, 0, "000+000", 45, 4, 1);
    insert.run("001000", 1, 100, "000+100", 46, 5, 2);
    insert.run("001000", 1, 200, "000+200", 46.1, 5.1, 3);
    insert.run("002000", 1, 0, "000+000", 0, 179.5, 1);
    insert.run("002000", 1, 100, "000+100", 0, -179.5, 2);
    const adapter = {
      getAllAsync: async (sql: string, ...params: number[]) =>
        database.prepare(sql).all(...params),
    } as unknown as Pick<SQLiteDatabase, "getAllAsync">;
    const visible = await findVisibleMilestones(adapter, [4, 45, 5, 46], 1);
    expect(visible.map((point) => point.label)).toEqual(["000+000", "000+100"]);
    expect(visible[0].coordinates).toEqual({ latitude: 45, longitude: 4 });
    const wrapped = await findVisibleMilestones(adapter, [179, -1, -179, 1], 1);
    expect(wrapped.map((point) => point.id.value)).toEqual([
      "002000:1:0",
      "002000:1:100",
    ]);
    expect(await findVisibleMilestones(adapter, [10, 10, 11, 11], 1)).toEqual(
      [],
    );
    for (const interval of [1000, 500, 100, 1] as const) {
      insert.run(
        "003000",
        1,
        interval,
        `${Math.floor(interval / 1000)}+${String(interval % 1000).padStart(3, "0")}`,
        45.5,
        4.5,
        1,
      );
      insert.run(
        "004000",
        1,
        interval,
        `${Math.floor(interval / 1000)}+${String(interval % 1000).padStart(3, "0")}`,
        0,
        -179.5,
        1,
      );
    }
    insert.run("005000", 1, 772, "000+772", 45.5, 4.5, 1);
    for (const interval of [1000, 500, 100, 1] as const) {
      const ordinary = await findVisibleMilestones(
        adapter,
        [4, 45, 5, 46],
        interval,
      );
      const crossing = await findVisibleMilestones(
        adapter,
        [179, -1, -179, 1],
        interval,
      );
      for (const [points, bounds, longitudePredicate] of [
        [ordinary, [45, 46, 4, 5], "longitude BETWEEN ? AND ?"],
        [crossing, [-1, 1, 179, -179], "(longitude >= ? OR longitude <= ?)"],
      ] as const) {
        const previousRows = database
          .prepare(
            `
          SELECT * FROM kilometric_points
          WHERE latitude BETWEEN ? AND ? AND ${longitudePredicate}
            AND position_m % ? = 0
          ORDER BY code_ligne, rg_troncon, position_m
        `,
          )
          .all(...bounds, interval);
        expect(points).toEqual(
          previousRows.map((row) => milestoneFromDatabaseRow(row, "baseline")),
        );
      }
      const expected = [1, 100, 500, 1000].filter(
        (position) => position % interval === 0,
      );
      expect(
        ordinary
          .filter((point) => point.lineCode === "003000")
          .map((point) => point.positionMeters),
      ).toEqual(expected);
      expect(
        crossing
          .filter((point) => point.lineCode === "004000")
          .map((point) => point.positionMeters),
      ).toEqual(expected);
      expect(ordinary.find((point) => point.positionMeters === 0)?.label).toBe(
        "000+000",
      );
      expect(
        ordinary
          .filter((point) => point.lineCode === "005000")
          .map((point) => point.label),
      ).toEqual(interval === 1 ? ["000+772"] : []);
    }
  } finally {
    database.close();
  }
});
