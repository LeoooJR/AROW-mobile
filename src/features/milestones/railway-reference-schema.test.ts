import {
  KILOMETRIC_POINTS_TABLE,
  KilometricPointsTable,
  RAILWAY_SECTIONS_TABLE,
  RailwayReferenceColumn,
  RailwaySectionsTable,
} from "./railway-reference-schema";

describe("railway reference schema descriptors", () => {
  test("describes railway sections in database order", () => {
    expect(RAILWAY_SECTIONS_TABLE).toBeInstanceOf(RailwaySectionsTable);
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
      RAILWAY_SECTIONS_TABLE.primaryKey.map((column) => column.name),
    ).toEqual(["code_ligne", "rg_troncon"]);
  });

  test("describes milestone identity and its section foreign key", () => {
    expect(KILOMETRIC_POINTS_TABLE).toBeInstanceOf(KilometricPointsTable);
    expect(
      KILOMETRIC_POINTS_TABLE.primaryKey.map((column) => column.name),
    ).toEqual(["code_ligne", "rg_troncon", "position_m"]);

    const [foreignKey] = KILOMETRIC_POINTS_TABLE.foreignKeys;
    expect(foreignKey?.columns.map((column) => column.name)).toEqual([
      "code_ligne",
      "rg_troncon",
    ]);
    expect(foreignKey?.referencedTableName).toBe("railway_sections");
    expect(foreignKey?.referencedColumns.map((column) => column.name)).toEqual([
      "code_ligne",
      "rg_troncon",
    ]);
  });

  test("builds qualified projections from immutable columns", () => {
    const code = KILOMETRIC_POINTS_TABLE.column("code_ligne");
    const label = KILOMETRIC_POINTS_TABLE.column("label");

    expect(code).toBeInstanceOf(RailwayReferenceColumn);
    expect(code.description).not.toHaveLength(0);
    expect(code.reference("point")).toBe("point.code_ligne");
    expect(KILOMETRIC_POINTS_TABLE.projection([code, label], "point")).toBe(
      "point.code_ligne, point.label",
    );
    expect(Object.isFrozen(code)).toBe(true);
    expect(Object.isFrozen(KILOMETRIC_POINTS_TABLE.columns)).toBe(true);
    expect(Object.isFrozen(KILOMETRIC_POINTS_TABLE.foreignKeys)).toBe(true);
    expect(Object.isFrozen(KILOMETRIC_POINTS_TABLE.primaryKey)).toBe(true);
  });
});
