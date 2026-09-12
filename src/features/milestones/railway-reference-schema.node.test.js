/** @jest-environment node */

const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const {
  KILOMETRIC_POINTS_TABLE,
  RAILWAY_SECTIONS_TABLE,
} = require("./railway-reference-schema");

const databasePath = path.join(__dirname, "../../statics/pk.sqlite");

function tableInfo(database, table) {
  return database.prepare(`PRAGMA table_info(${table.name})`).all();
}

function tableMetadata(database, table) {
  return database
    .prepare("PRAGMA table_list")
    .all()
    .find((row) => row.name === table.name);
}

describe("railway reference schema synchronization", () => {
  let database;

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

      const metadata = tableMetadata(database, table);
      expect(metadata).toMatchObject({
        strict: table.strict ? 1 : 0,
        wr: table.withoutRowId ? 1 : 0,
      });
    },
  );

  test("milestone foreign key matches the bundled database", () => {
    const rows = database
      .prepare(`PRAGMA foreign_key_list(${KILOMETRIC_POINTS_TABLE.name})`)
      .all()
      .sort((left, right) => Number(left.seq) - Number(right.seq));
    const [foreignKey] = KILOMETRIC_POINTS_TABLE.foreignKeys;

    expect(rows.map((row) => row.from)).toEqual(
      foreignKey.columns.map((column) => column.name),
    );
    expect(rows.map((row) => row.to)).toEqual(
      foreignKey.referencedColumns.map((column) => column.name),
    );
    expect(new Set(rows.map((row) => row.table))).toEqual(
      new Set([foreignKey.referencedTableName]),
    );
  });
});
