/** @jest-environment node */

import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { MILESTONE_DISPLAY_CLASSES } from "../milestone-display";
import { validatePointDisplayMetadata } from "../../../../script/railway-database/point-display-metadata";

import {
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
  createTableSql,
  type RailwayReferenceTableDescriptor,
} from "@shared/railway-reference/schema";
import {
  FIND_MILESTONE_QUERY,
  FIND_RAILWAY_MILESTONE_BOUNDS_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
  visibleMilestonesQuery,
} from "@/features/railway-reference/sqlite/queries";
import { searchableSectionRowsToRailways } from "@/features/railway-reference/mapping/railway-mapper";

const databasePath = path.join(
  __dirname,
  "../../../statics/railway_reference.sqlite",
);

function tableInfo(
  database: DatabaseSync,
  table: RailwayReferenceTableDescriptor,
) {
  return database.prepare(`PRAGMA table_info(${table.name})`).all();
}

function tableMetadata(
  database: DatabaseSync,
  table: RailwayReferenceTableDescriptor,
) {
  return database
    .prepare("PRAGMA table_list")
    .all()
    .find((row) => row.name === table.name);
}

describe("railway reference schema synchronization", () => {
  let database: DatabaseSync | undefined;

  function getDatabase(): DatabaseSync {
    if (database === undefined) {
      throw new Error("Railway reference database was not initialized");
    }
    return database;
  }

  beforeAll(() => {
    database = new DatabaseSync(databasePath, { readOnly: true });
  });

  afterAll(() => {
    database?.close();
  });

  test("stored bounds match independent numeric extrema for every section", () => {
    const database = getDatabase();
    const lookup = database.prepare(FIND_RAILWAY_MILESTONE_BOUNDS_QUERY);
    const reference = database.prepare(`SELECT * FROM kilometric_points
      WHERE code_ligne = ? AND rg_troncon = ? AND position_m IN (
        SELECT MIN(position_m) FROM kilometric_points WHERE code_ligne = ? AND rg_troncon = ?
        UNION SELECT MAX(position_m) FROM kilometric_points WHERE code_ligne = ? AND rg_troncon = ?
      ) ORDER BY position_m`);
    for (const section of database
      .prepare("SELECT code_ligne, rg_troncon FROM railway_sections")
      .all()) {
      const identity = [section.code_ligne, section.rg_troncon];
      expect(lookup.all(...identity)).toEqual(
        reference.all(...identity, ...identity, ...identity),
      );
    }
    expect(lookup.all("999999", 1)).toEqual([]);
    const catalogue = database.prepare(LOAD_SEARCHABLE_RAILWAYS_QUERY).all();
    const aggregated = database
      .prepare(
        `
      WITH bounds AS (SELECT code_ligne, rg_troncon, MIN(position_m) AS first, MAX(position_m) AS last
        FROM kilometric_points GROUP BY code_ligne, rg_troncon)
      SELECT section.*, bounds.first AS minimum_position_m, lo.label AS minimum_label,
        bounds.last AS maximum_position_m, hi.label AS maximum_label
      FROM railway_sections AS section
      JOIN bounds USING(code_ligne, rg_troncon)
      JOIN kilometric_points AS lo ON lo.code_ligne = section.code_ligne AND lo.rg_troncon = section.rg_troncon AND lo.position_m = bounds.first
      JOIN kilometric_points AS hi ON hi.code_ligne = section.code_ligne AND hi.rg_troncon = section.rg_troncon AND hi.position_m = bounds.last
      ORDER BY section.lib_ligne, section.code_ligne, section.rg_troncon
    `,
      )
      .all();
    expect(catalogue).toEqual(aggregated);
    const plan = database
      .prepare(`EXPLAIN QUERY PLAN ${FIND_RAILWAY_MILESTONE_BOUNDS_QUERY}`)
      .all("893000", 1);
    expect(plan.map((row) => row.detail)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("SEARCH section USING PRIMARY KEY"),
        expect.stringContaining("SEARCH point USING PRIMARY KEY"),
      ]),
    );
    expect(plan.some((row) => /SCAN|SUBQUERY/.test(String(row.detail)))).toBe(
      false,
    );
    expect(LOAD_SEARCHABLE_RAILWAYS_QUERY).not.toMatch(/MIN\(|MAX\(|GROUP BY/);
  });

  test.each([RAILWAY_SECTIONS_TABLE, KILOMETRIC_POINTS_TABLE])(
    "$name descriptor matches bundled SQLite metadata",
    (table) => {
      const activeDatabase = getDatabase();
      const columns = tableInfo(activeDatabase, table);
      expect(
        columns.map((column) => ({
          name: column.name,
          nullable: column.notnull === 0,
          primaryKeyPosition: column.pk === 0 ? undefined : Number(column.pk),
          type: column.type,
        })),
      ).toEqual(
        table.columns.map((column) => ({
          name: column.name,
          nullable: column.nullable,
          primaryKeyPosition: column.primaryKeyPosition,
          type: column.type,
        })),
      );

      expect(tableMetadata(activeDatabase, table)).toMatchObject({
        strict: table.strict ? 1 : 0,
        wr: table.withoutRowId ? 1 : 0,
      });

      const schema = activeDatabase
        .prepare(
          "SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?",
        )
        .get(table.name);
      expect(schema?.sql).toBe(createTableSql(table).trim().replace(/;$/, ""));
    },
  );

  test("milestone foreign key matches the bundled database", () => {
    const rows = getDatabase()
      .prepare(`PRAGMA foreign_key_list(${KILOMETRIC_POINTS_TABLE.name})`)
      .all()
      .sort((left, right) => Number(left.seq) - Number(right.seq));
    const [foreignKey] = KILOMETRIC_POINTS_TABLE.foreignKeys;

    expect(rows.map((row) => row.from)).toEqual(foreignKey?.columns);
    expect(rows.map((row) => row.to)).toEqual(foreignKey?.referencedColumns);
    expect(new Set(rows.map((row) => row.table))).toEqual(
      new Set([foreignKey?.referencedTableName]),
    );
  });

  test("stored classes and the narrow index match the pinned dataset", () => {
    const database = getDatabase();
    expect(() => validatePointDisplayMetadata(database)).not.toThrow();
    expect(database.prepare("PRAGMA user_version").get()).toEqual({
      user_version: 5,
    });
    expect(
      database
        .prepare(
          "SELECT visibility_class, COUNT(*) AS count FROM kilometric_points GROUP BY visibility_class ORDER BY visibility_class",
        )
        .all(),
    ).toEqual([
      { visibility_class: 0, count: 36946 },
      { visibility_class: 1, count: 36800 },
      { visibility_class: 2, count: 294130 },
      { visibility_class: 3, count: 3858 },
    ]);
    for (const classes of Object.values(MILESTONE_DISPLAY_CLASSES)) {
      const sql = visibleMilestonesQuery(classes, false);
      const parameters = [45.7, 45.8, 4.8, 4.9, ...classes];
      const plan = database
        .prepare(`EXPLAIN QUERY PLAN ${sql}`)
        .all(...parameters)
        .map((row) => String(row.detail));
      expect(
        plan.some((detail) =>
          detail.includes("USING INDEX kilometric_points_display_idx"),
        ),
      ).toBe(true);
      expect(
        plan.some((detail) => detail.includes("SCAN kilometric_points")),
      ).toBe(false);
      expect(
        database
          .prepare(`EXPLAIN ${sql}`)
          .all(...parameters)
          .some((row) => row.opcode === "Remainder"),
      ).toBe(false);
    }
  });

  test("bundled database passes integrity and foreign-key checks", () => {
    const activeDatabase = getDatabase();
    expect(activeDatabase.prepare("PRAGMA integrity_check").get()).toEqual({
      integrity_check: "ok",
    });
    expect(
      activeDatabase.prepare("PRAGMA foreign_key_check").get(),
    ).toBeUndefined();
  });

  test("exact milestone lookup uses the composite primary key", () => {
    const plan = getDatabase()
      .prepare(`EXPLAIN QUERY PLAN ${FIND_MILESTONE_QUERY}`)
      .all("893000", 1, 509_000);

    expect(plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: expect.stringContaining(
            "SEARCH kilometric_points USING PRIMARY KEY",
          ),
        }),
      ]),
    );
    expect(plan).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          detail: expect.stringMatching(/SCAN kilometric_points/),
        }),
      ]),
    );
  });

  test("the full searchable catalogue includes fallback ranks under their known line name", () => {
    const railways = searchableSectionRowsToRailways(
      getDatabase().prepare(LOAD_SEARCHABLE_RAILWAYS_QUERY).all(),
    );
    const railway = railways.find((line) => line.code === "830356");
    expect(railway?.name).toBe("Raccordement sud de Tarascon");
    expect(
      railway?.sections.find((section) => section.sectionRank === 2)?.geometry
        .status,
    ).toBe("absent");
  });

  test("retains precise endpoints and the first source coordinates in the expanded asset", () => {
    const database = getDatabase();
    const lookup = database.prepare(FIND_MILESTONE_QUERY);
    expect(lookup.get("340311", 1, 136_772)).toMatchObject({
      label: "136+772",
      latitude: 49.4364444712341,
      longitude: 1.121872877785761,
    });
    expect(lookup.get("340311", 1, 137_980)).toMatchObject({
      label: "137+980",
    });
    expect(lookup.get("001000", 1, 88_000)).toMatchObject({
      label: "088+000",
      latitude: 48.514806709249875,
      longitude: 3.248754757164401,
    });
    expect(
      database
        .prepare(
          "SELECT COUNT(*) AS count, MIN(position_m) AS minimum, MAX(position_m) AS maximum FROM kilometric_points WHERE code_ligne = '893000' AND rg_troncon = 1",
        )
        .get(),
    ).toEqual({ count: 124, minimum: 499752, maximum: 511600 });
  });
});
