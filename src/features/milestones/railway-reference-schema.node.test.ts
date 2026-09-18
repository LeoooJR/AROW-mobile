/** @jest-environment node */

import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
  createTableSql,
  type RailwayReferenceTableDescriptor,
} from "@shared/railway-reference/schema";

const databasePath = path.join(
  __dirname,
  "../../statics/railway_reference.sqlite",
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
  let database: DatabaseSync;

  beforeAll(() => {
    database = new DatabaseSync(databasePath, { readOnly: true });
  });

  afterAll(() => {
    database.close();
  });

  test.each([RAILWAY_SECTIONS_TABLE, KILOMETRIC_POINTS_TABLE])(
    "$name descriptor matches bundled SQLite metadata",
    (table) => {
      const columns = tableInfo(database, table);
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

      expect(tableMetadata(database, table)).toMatchObject({
        strict: table.strict ? 1 : 0,
        wr: table.withoutRowId ? 1 : 0,
      });

      const schema = database
        .prepare(
          "SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = ?",
        )
        .get(table.name);
      expect(schema?.sql).toBe(createTableSql(table).trim().replace(/;$/, ""));
    },
  );

  test("milestone foreign key matches the bundled database", () => {
    const rows = database
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
    expect(database.prepare("PRAGMA integrity_check").get()).toEqual({
      integrity_check: "ok",
    });
    expect(database.prepare("PRAGMA foreign_key_check").get()).toBeUndefined();
  });
});
