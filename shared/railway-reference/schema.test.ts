import {
  columnReference,
  createTableSql,
  KILOMETRIC_POINTS_TABLE,
  primaryKeyColumns,
  projection,
  RAILWAY_SECTIONS_TABLE,
  tableColumn,
} from "./schema";

describe("railway reference schema descriptors", () => {
  test("describes railway sections in database order", () => {
    expect(RAILWAY_SECTIONS_TABLE.name).toBe("railway_sections");
    expect(RAILWAY_SECTIONS_TABLE.strict).toBe(true);
    expect(RAILWAY_SECTIONS_TABLE.withoutRowId).toBe(true);
    expect(
      RAILWAY_SECTIONS_TABLE.columns.map((column) => ({
        name: column.name,
        nullable: column.nullable,
        primaryKeyPosition: column.primaryKeyPosition,
        type: column.type,
      })),
    ).toEqual([
      {
        name: "code_ligne",
        nullable: false,
        primaryKeyPosition: 1,
        type: "TEXT",
      },
      {
        name: "rg_troncon",
        nullable: false,
        primaryKeyPosition: 2,
        type: "INTEGER",
      },
      {
        name: "idgaia",
        nullable: true,
        primaryKeyPosition: undefined,
        type: "TEXT",
      },
      {
        name: "lib_ligne",
        nullable: false,
        primaryKeyPosition: undefined,
        type: "TEXT",
      },
      {
        name: "type_ligne",
        nullable: true,
        primaryKeyPosition: undefined,
        type: "TEXT",
      },
      {
        name: "pkd",
        nullable: true,
        primaryKeyPosition: undefined,
        type: "TEXT",
      },
      {
        name: "pkf",
        nullable: true,
        primaryKeyPosition: undefined,
        type: "TEXT",
      },
      {
        name: "has_geometry",
        nullable: false,
        primaryKeyPosition: undefined,
        type: "INTEGER",
      },
    ]);
    expect(
      primaryKeyColumns(RAILWAY_SECTIONS_TABLE).map(({ name }) => name),
    ).toEqual(["code_ligne", "rg_troncon"]);
  });

  test("describes milestone identity and its section foreign key", () => {
    expect(
      primaryKeyColumns(KILOMETRIC_POINTS_TABLE).map(({ name }) => name),
    ).toEqual(["code_ligne", "rg_troncon", "position_m"]);
    expect(KILOMETRIC_POINTS_TABLE.foreignKeys).toEqual([
      {
        columns: ["code_ligne", "rg_troncon"],
        referencedColumns: ["code_ligne", "rg_troncon"],
        referencedTableName: "railway_sections",
      },
    ]);
  });

  test("builds qualified references and projections", () => {
    expect(
      tableColumn(KILOMETRIC_POINTS_TABLE, "code_ligne").description,
    ).not.toHaveLength(0);
    expect(
      columnReference(KILOMETRIC_POINTS_TABLE, "code_ligne", "point"),
    ).toBe("point.code_ligne");
    expect(
      projection(KILOMETRIC_POINTS_TABLE, ["code_ligne", "label"], "point"),
    ).toBe("point.code_ligne, point.label");
    expect(() =>
      tableColumn(KILOMETRIC_POINTS_TABLE, "missing" as "code_ligne"),
    ).toThrow("Unknown column missing on kilometric_points");
  });

  test("freezes descriptors and deterministically renders the existing DDL", () => {
    expect(Object.isFrozen(KILOMETRIC_POINTS_TABLE)).toBe(true);
    expect(Object.isFrozen(KILOMETRIC_POINTS_TABLE.columns)).toBe(true);
    expect(Object.isFrozen(KILOMETRIC_POINTS_TABLE.foreignKeys[0])).toBe(true);
    expect(createTableSql(RAILWAY_SECTIONS_TABLE)).toContain(
      "CREATE TABLE railway_sections",
    );
    expect(createTableSql(KILOMETRIC_POINTS_TABLE)).toContain(
      "FOREIGN KEY (code_ligne, rg_troncon)",
    );
    expect(createTableSql(KILOMETRIC_POINTS_TABLE)).toBe(
      createTableSql(KILOMETRIC_POINTS_TABLE),
    );
  });
});
