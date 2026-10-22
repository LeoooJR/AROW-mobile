/** @jest-environment node */

import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
  createTableSql,
  type RailwayReferenceTableDescriptor,
} from "@shared/railway-reference/schema";
import {
  FIND_MILESTONE_QUERY,
  LOAD_SEARCHABLE_RAILWAYS_QUERY,
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
