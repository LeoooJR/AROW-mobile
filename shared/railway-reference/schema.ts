export type SQLiteColumnType = "INTEGER" | "REAL" | "TEXT";

export interface RailwayReferenceColumnDescriptor<
  Name extends string = string,
> {
  readonly checkLayout?: "continuation" | "inline";
  readonly checks: readonly string[];
  readonly description: string;
  readonly name: Name;
  readonly nullable: boolean;
  readonly primaryKeyPosition?: number;
  readonly type: SQLiteColumnType;
}

export interface RailwayReferenceForeignKeyDescriptor {
  readonly columns: readonly string[];
  readonly referencedColumns: readonly string[];
  readonly referencedTableName: string;
}

export interface RailwayReferenceTableDescriptor<
  Name extends string = string,
  Columns extends readonly RailwayReferenceColumnDescriptor[] =
    readonly RailwayReferenceColumnDescriptor[],
> {
  readonly checks: readonly string[];
  readonly columns: Columns;
  readonly foreignKeys: readonly RailwayReferenceForeignKeyDescriptor[];
  readonly name: Name;
  readonly strict: boolean;
  readonly withoutRowId: boolean;
}

function column<const Name extends string>(
  descriptor: Omit<RailwayReferenceColumnDescriptor<Name>, "checks"> & {
    readonly checks?: readonly string[];
  },
): RailwayReferenceColumnDescriptor<Name> {
  return Object.freeze({
    ...descriptor,
    checks: Object.freeze([...(descriptor.checks ?? [])]),
  });
}

function foreignKey(
  descriptor: RailwayReferenceForeignKeyDescriptor,
): RailwayReferenceForeignKeyDescriptor {
  return Object.freeze({
    ...descriptor,
    columns: Object.freeze([...descriptor.columns]),
    referencedColumns: Object.freeze([...descriptor.referencedColumns]),
  });
}

function table<
  const Name extends string,
  const Columns extends readonly RailwayReferenceColumnDescriptor[],
>(
  descriptor: RailwayReferenceTableDescriptor<Name, Columns>,
): RailwayReferenceTableDescriptor<Name, Columns> {
  return Object.freeze({
    ...descriptor,
    checks: Object.freeze([...descriptor.checks]),
    columns: Object.freeze([...descriptor.columns]) as unknown as Columns,
    foreignKeys: Object.freeze(descriptor.foreignKeys.map(foreignKey)),
  });
}

export const RAILWAY_SECTIONS_TABLE = table({
  checks: [
    "CHECK (\n      has_geometry = 0 OR\n      (idgaia IS NOT NULL AND type_ligne IS NOT NULL AND pkd IS NOT NULL AND pkf IS NOT NULL)\n    )",
  ],
  columns: [
    column({
      checkLayout: "continuation",
      checks: ["length(code_ligne) = 6 AND code_ligne NOT GLOB '*[^0-9]*'"],
      description: "Canonical six-digit railway line code",
      name: "code_ligne",
      nullable: false,
      primaryKeyPosition: 1,
      type: "TEXT",
    }),
    column({
      checkLayout: "inline",
      checks: ["rg_troncon > 0"],
      description: "Section rank within the railway line",
      name: "rg_troncon",
      nullable: false,
      primaryKeyPosition: 2,
      type: "INTEGER",
    }),
    column({
      description: "GAIA infrastructure identifier when geometry is present",
      name: "idgaia",
      nullable: true,
      type: "TEXT",
    }),
    column({
      checkLayout: "inline",
      checks: ["length(lib_ligne) > 0"],
      description: "Railway line display name",
      name: "lib_ligne",
      nullable: false,
      type: "TEXT",
    }),
    column({
      description: "Railway infrastructure type when geometry is present",
      name: "type_ligne",
      nullable: true,
      type: "TEXT",
    }),
    column({
      description: "Geometry section start milestone",
      name: "pkd",
      nullable: true,
      type: "TEXT",
    }),
    column({
      description: "Geometry section end milestone",
      name: "pkf",
      nullable: true,
      type: "TEXT",
    }),
    column({
      checkLayout: "inline",
      checks: ["has_geometry IN (0, 1)"],
      description: "Whether complete GeoJSON metadata exists for the section",
      name: "has_geometry",
      nullable: false,
      type: "INTEGER",
    }),
  ] as const,
  foreignKeys: [],
  name: "railway_sections",
  strict: true,
  withoutRowId: true,
});

export const KILOMETRIC_POINTS_TABLE = table({
  checks: [
    `CHECK (
      instr(label, '+') > 1 AND
      length(label) - instr(label, '+') = 3 AND
      substr(label, 1, instr(label, '+') - 1) NOT GLOB '*[^0-9]*' AND
      substr(label, instr(label, '+') + 1) NOT GLOB '*[^0-9]*' AND
      CAST(substr(label, 1, instr(label, '+') - 1) AS INTEGER) = position_m / 1000 AND
      CAST(substr(label, instr(label, '+') + 1) AS INTEGER) = position_m % 1000
    )`,
  ],
  columns: [
    column({
      checkLayout: "continuation",
      checks: ["length(code_ligne) = 6 AND code_ligne NOT GLOB '*[^0-9]*'"],
      description: "Canonical six-digit railway line code",
      name: "code_ligne",
      nullable: false,
      primaryKeyPosition: 1,
      type: "TEXT",
    }),
    column({
      checkLayout: "inline",
      checks: ["rg_troncon > 0"],
      description: "Section rank within the railway line",
      name: "rg_troncon",
      nullable: false,
      primaryKeyPosition: 2,
      type: "INTEGER",
    }),
    column({
      checkLayout: "inline",
      checks: ["position_m >= 0"],
      description: "Exact non-negative position along the line in metres",
      name: "position_m",
      nullable: false,
      primaryKeyPosition: 3,
      type: "INTEGER",
    }),
    column({
      checkLayout: "inline",
      checks: ["length(label) > 0"],
      description: "Canonical source milestone label",
      name: "label",
      nullable: false,
      type: "TEXT",
    }),
    column({
      checkLayout: "inline",
      checks: ["latitude BETWEEN -90 AND 90"],
      description: "WGS84 latitude",
      name: "latitude",
      nullable: false,
      type: "REAL",
    }),
    column({
      checkLayout: "inline",
      checks: ["longitude BETWEEN -180 AND 180"],
      description: "WGS84 longitude",
      name: "longitude",
      nullable: false,
      type: "REAL",
    }),
  ] as const,
  foreignKeys: [
    {
      columns: ["code_ligne", "rg_troncon"],
      referencedColumns: ["code_ligne", "rg_troncon"],
      referencedTableName: "railway_sections",
    },
  ],
  name: "kilometric_points",
  strict: true,
  withoutRowId: true,
});

type ColumnName<Table extends RailwayReferenceTableDescriptor> =
  Table["columns"][number]["name"];

export function tableColumn<
  Table extends RailwayReferenceTableDescriptor,
  Name extends ColumnName<Table>,
>(
  tableDescriptor: Table,
  name: Name,
): Extract<Table["columns"][number], { name: Name }> {
  const descriptor = tableDescriptor.columns.find(
    (candidate) => candidate.name === name,
  );
  if (descriptor === undefined) {
    throw new Error(`Unknown column ${name} on ${tableDescriptor.name}`);
  }
  return descriptor as Extract<Table["columns"][number], { name: Name }>;
}

export function primaryKeyColumns<
  Table extends RailwayReferenceTableDescriptor,
>(tableDescriptor: Table): readonly Table["columns"][number][] {
  return [...tableDescriptor.columns]
    .filter((descriptor) => descriptor.primaryKeyPosition !== undefined)
    .sort(
      (left, right) =>
        (left.primaryKeyPosition ?? 0) - (right.primaryKeyPosition ?? 0),
    );
}

export function columnReference<
  Table extends RailwayReferenceTableDescriptor,
  Name extends ColumnName<Table>,
>(tableDescriptor: Table, name: Name, alias?: string): string {
  const columnName = tableColumn(tableDescriptor, name).name;
  return alias === undefined ? columnName : `${alias}.${columnName}`;
}

export function projection<
  Table extends RailwayReferenceTableDescriptor,
  Name extends ColumnName<Table>,
>(tableDescriptor: Table, names: readonly Name[], alias?: string): string {
  return names
    .map((name) => columnReference(tableDescriptor, name, alias))
    .join(", ");
}

function columnSql(descriptor: RailwayReferenceColumnDescriptor): string {
  const required = descriptor.nullable ? "" : " NOT NULL";
  const firstLine = `    ${descriptor.name} ${descriptor.type}${required}`;
  if (descriptor.checks.length === 0) {
    return firstLine;
  }

  const checks = descriptor.checks.map((check) => `CHECK (${check})`).join(" ");
  return descriptor.checkLayout === "continuation"
    ? `${firstLine}\n      ${checks}`
    : `${firstLine} ${checks}`;
}

export function createTableSql(
  tableDescriptor: RailwayReferenceTableDescriptor,
): string {
  const primaryKey = primaryKeyColumns(tableDescriptor)
    .map(({ name }) => name)
    .join(", ");
  const elements = [
    ...tableDescriptor.columns.map(columnSql),
    ...tableDescriptor.checks.map((check) => `    ${check}`),
    `    PRIMARY KEY (${primaryKey})`,
    ...tableDescriptor.foreignKeys.map(
      (descriptor) =>
        `    FOREIGN KEY (${descriptor.columns.join(", ")})\n      REFERENCES ${descriptor.referencedTableName}(${descriptor.referencedColumns.join(", ")})`,
    ),
  ];
  const body = elements
    .map((element, index) =>
      index === elements.length - 1 ? element : `${element},`,
    )
    .join("\n");
  const options = [
    tableDescriptor.strict ? "STRICT" : undefined,
    tableDescriptor.withoutRowId ? "WITHOUT ROWID" : undefined,
  ].filter((option): option is string => option !== undefined);

  return `\n  CREATE TABLE ${tableDescriptor.name} (\n${body}\n  )${options.length === 0 ? "" : ` ${options.join(", ")}`};\n`;
}
