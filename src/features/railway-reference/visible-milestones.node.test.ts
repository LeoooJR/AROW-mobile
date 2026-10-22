/** @jest-environment node */
import { DatabaseSync } from "node:sqlite";
import type { SQLiteDatabase } from "expo-sqlite";
import { findVisibleMilestones, markerBounds } from "./visible-milestones";

test("marker requests are zoom-gated, validated and normalize wrapped longitudes", () => {
  expect(markerBounds({ bounds: [4, 45, 5, 46], zoom: 9.9 })).toBeUndefined();
  expect(markerBounds({ bounds: [4, 46, 5, 45], zoom: 14 })).toBeUndefined();
  expect(markerBounds({ bounds: [NaN, 45, 5, 46], zoom: 14 })).toBeUndefined();
  expect(markerBounds({ bounds: [4, 45, 5, 91], zoom: 14 })).toBeUndefined();
  expect(markerBounds({ bounds: [4.85933, 45, 5, 46], zoom: 10 })).toEqual([
    4.85933, 45, 5, 46,
  ]);
  expect(markerBounds({ bounds: [179, -1, 181, 1], zoom: 14 })).toEqual([
    179, -1, -179, 1,
  ]);
  expect(markerBounds({ bounds: [-540, -90, 540, 90], zoom: 10 })).toEqual([
    -180, -90, 180, 90,
  ]);
});

test("viewport SQL includes boundary points and both sides of the antimeridian", async () => {
  const database = new DatabaseSync(":memory:");
  try {
    database.exec(
      "CREATE TABLE kilometric_points(code_ligne TEXT, rg_troncon INTEGER, position_m INTEGER, label TEXT, latitude REAL, longitude REAL, position_in_section INTEGER)",
    );
    const insert = database.prepare(
      "INSERT INTO kilometric_points VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    insert.run("001000", 1, 0, "000+000", 45, 4, 1);
    insert.run("001000", 1, 100, "000+100", 46, 5, 2);
    insert.run("001000", 1, 200, "000+200", 46.1, 5.1, 3);
    insert.run("002000", 1, 0, "000+000", 0, 179.5, 1);
    insert.run("002000", 1, 100, "000+100", 0, -179.5, 2);
    const adapter = {
      getAllAsync: async (sql: string, ...params: number[]) =>
        database.prepare(sql).all(...params),
    } as unknown as Pick<SQLiteDatabase, "getAllAsync">;
    const visible = await findVisibleMilestones(adapter, [4, 45, 5, 46]);
    expect(visible.map((point) => point.label)).toEqual(["000+000", "000+100"]);
    expect(visible[0].coordinates).toEqual({ latitude: 45, longitude: 4 });
    const wrapped = await findVisibleMilestones(adapter, [179, -1, -179, 1]);
    expect(wrapped.map((point) => point.id.value)).toEqual([
      "002000:1:0",
      "002000:1:100",
    ]);
    expect(await findVisibleMilestones(adapter, [10, 10, 11, 11])).toEqual([]);
  } finally {
    database.close();
  }
});
