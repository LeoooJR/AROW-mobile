/** @jest-environment node */
import { DatabaseSync } from "node:sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { findRailwayMilestoneBounds } from "./repository";

test("uses numeric PK bounds within the exact section, including empty and single-point sections", async () => {
  const database = new DatabaseSync(":memory:");
  database.exec(
    "CREATE TABLE kilometric_points (code_ligne TEXT, rg_troncon INTEGER, position_m INTEGER, label TEXT, latitude REAL, longitude REAL)",
  );
  database.exec(`INSERT INTO kilometric_points VALUES
    ('893000', 1, 99000, '99+000', 45, 4),
    ('893000', 1, 100000, '100+000', 46, 5),
    ('893000', 1, 99500, '99+500', 45.5, 4.5),
    ('893000', 2, 1000, '1+000', 47, 6),
    ('894000', 1, 0, '0+000', 48, 7)`);
  const source: Pick<SQLiteDatabase, "getAllAsync"> = {
    getAllAsync: jest
      .fn()
      .mockImplementation(
        async (sql: string, ...parameters: (string | number)[]) =>
          database.prepare(sql).all(...parameters),
      ),
  };
  try {
    const bounds = await findRailwayMilestoneBounds(
      source,
      new RailwaySectionId("893000", 1),
    );
    expect(bounds.first?.label).toBe("99+000");
    expect(bounds.last?.label).toBe("100+000");
    expect(bounds.first?.coordinates).toEqual({ latitude: 45, longitude: 4 });
    const single = await findRailwayMilestoneBounds(
      source,
      new RailwaySectionId("893000", 2),
    );
    expect(single.first).toBe(single.last);
    expect(
      await findRailwayMilestoneBounds(
        source,
        new RailwaySectionId("893000", 3),
      ),
    ).toEqual({ first: undefined, last: undefined });
    database.exec(
      "UPDATE kilometric_points SET latitude = 100 WHERE rg_troncon = 2",
    );
    await expect(
      findRailwayMilestoneBounds(source, new RailwaySectionId("893000", 2)),
    ).rejects.toThrow();
  } finally {
    database.close();
  }
});
