export type SQLiteColumnType = "INTEGER" | "REAL" | "TEXT";

interface ColumnDescriptorInput<Name extends string> {
  readonly description: string;
  readonly name: Name;
  readonly nullable: boolean;
  readonly primaryKeyPosition?: number;
  readonly type: SQLiteColumnType;
}

export class RailwayReferenceColumn<Name extends string = string> {
  readonly #description: string;
  readonly #name: Name;
  readonly #nullable: boolean;
  readonly #primaryKeyPosition: number | undefined;
  readonly #type: SQLiteColumnType;

  public constructor(input: ColumnDescriptorInput<Name>) {
    this.#description = input.description;
    this.#name = input.name;
    this.#nullable = input.nullable;
    this.#primaryKeyPosition = input.primaryKeyPosition;
    this.#type = input.type;
    Object.freeze(this);
  }

  public get description(): string {
    return this.#description;
  }

  public get name(): Name {
    return this.#name;
  }

  public get nullable(): boolean {
    return this.#nullable;
  }

  public get primaryKeyPosition(): number | undefined {
    return this.#primaryKeyPosition;
  }

  public get type(): SQLiteColumnType {
    return this.#type;
  }

  public reference(alias?: string): string {
    return alias === undefined ? this.#name : `${alias}.${this.#name}`;
  }
}

export class RailwayReferenceForeignKey {
  readonly #columns: readonly RailwayReferenceColumn[];
  readonly #referencedColumns: readonly RailwayReferenceColumn[];
  readonly #referencedTableName: string;

  public constructor(
    columns: readonly RailwayReferenceColumn[],
    referencedTableName: string,
    referencedColumns: readonly RailwayReferenceColumn[],
  ) {
    this.#columns = Object.freeze([...columns]);
    this.#referencedTableName = referencedTableName;
    this.#referencedColumns = Object.freeze([...referencedColumns]);
    Object.freeze(this);
  }

  public get columns(): readonly RailwayReferenceColumn[] {
    return this.#columns;
  }

  public get referencedColumns(): readonly RailwayReferenceColumn[] {
    return this.#referencedColumns;
  }

  public get referencedTableName(): string {
    return this.#referencedTableName;
  }
}

abstract class RailwayReferenceTable<
  Columns extends Record<string, RailwayReferenceColumn>,
> {
  readonly #columns: readonly RailwayReferenceColumn[];
  readonly #columnsByName: Columns;
  readonly #foreignKeys: readonly RailwayReferenceForeignKey[];
  readonly #name: string;
  readonly #primaryKey: readonly RailwayReferenceColumn[];

  public readonly strict = true;
  public readonly withoutRowId = true;

  protected constructor(
    name: string,
    columnsByName: Columns,
    foreignKeys: readonly RailwayReferenceForeignKey[] = [],
  ) {
    this.#name = name;
    this.#columnsByName = Object.freeze(columnsByName);
    this.#columns = Object.freeze(Object.values(columnsByName));
    this.#foreignKeys = Object.freeze([...foreignKeys]);
    this.#primaryKey = Object.freeze(
      this.#columns
        .filter((column) => column.primaryKeyPosition !== undefined)
        .sort(
          (left, right) =>
            (left.primaryKeyPosition ?? 0) - (right.primaryKeyPosition ?? 0),
        ),
    );
  }

  public get columns(): readonly RailwayReferenceColumn[] {
    return this.#columns;
  }

  public get foreignKeys(): readonly RailwayReferenceForeignKey[] {
    return this.#foreignKeys;
  }

  public get name(): string {
    return this.#name;
  }

  public get primaryKey(): readonly RailwayReferenceColumn[] {
    return this.#primaryKey;
  }

  public column<Name extends keyof Columns>(name: Name): Columns[Name] {
    return this.#columnsByName[name];
  }

  public projection(
    columns: readonly RailwayReferenceColumn[],
    alias?: string,
  ): string {
    return columns.map((column) => column.reference(alias)).join(", ");
  }
}

const railwaySectionColumns = {
  code_ligne: new RailwayReferenceColumn({
    description: "Canonical six-digit railway line code",
    name: "code_ligne",
    nullable: false,
    primaryKeyPosition: 1,
    type: "TEXT",
  }),
  rg_troncon: new RailwayReferenceColumn({
    description: "Section rank within the railway line",
    name: "rg_troncon",
    nullable: false,
    primaryKeyPosition: 2,
    type: "INTEGER",
  }),
  idgaia: new RailwayReferenceColumn({
    description: "GAIA infrastructure identifier when geometry is present",
    name: "idgaia",
    nullable: true,
    type: "TEXT",
  }),
  lib_ligne: new RailwayReferenceColumn({
    description: "Railway line display name",
    name: "lib_ligne",
    nullable: false,
    type: "TEXT",
  }),
  type_ligne: new RailwayReferenceColumn({
    description: "Railway infrastructure type when geometry is present",
    name: "type_ligne",
    nullable: true,
    type: "TEXT",
  }),
  pkd: new RailwayReferenceColumn({
    description: "Geometry section start milestone",
    name: "pkd",
    nullable: true,
    type: "TEXT",
  }),
  pkf: new RailwayReferenceColumn({
    description: "Geometry section end milestone",
    name: "pkf",
    nullable: true,
    type: "TEXT",
  }),
  has_geometry: new RailwayReferenceColumn({
    description: "Whether complete GeoJSON metadata exists for the section",
    name: "has_geometry",
    nullable: false,
    type: "INTEGER",
  }),
} as const;

export class RailwaySectionsTable extends RailwayReferenceTable<
  typeof railwaySectionColumns
> {
  public constructor() {
    super("railway_sections", railwaySectionColumns);
    Object.freeze(this);
  }
}

const kilometricPointColumns = {
  code_ligne: new RailwayReferenceColumn({
    description: "Canonical six-digit railway line code",
    name: "code_ligne",
    nullable: false,
    primaryKeyPosition: 1,
    type: "TEXT",
  }),
  rg_troncon: new RailwayReferenceColumn({
    description: "Section rank within the railway line",
    name: "rg_troncon",
    nullable: false,
    primaryKeyPosition: 2,
    type: "INTEGER",
  }),
  position_m: new RailwayReferenceColumn({
    description: "Exact non-negative position along the line in metres",
    name: "position_m",
    nullable: false,
    primaryKeyPosition: 3,
    type: "INTEGER",
  }),
  label: new RailwayReferenceColumn({
    description: "Canonical source milestone label",
    name: "label",
    nullable: false,
    type: "TEXT",
  }),
  latitude: new RailwayReferenceColumn({
    description: "WGS84 latitude",
    name: "latitude",
    nullable: false,
    type: "REAL",
  }),
  longitude: new RailwayReferenceColumn({
    description: "WGS84 longitude",
    name: "longitude",
    nullable: false,
    type: "REAL",
  }),
} as const;

export class KilometricPointsTable extends RailwayReferenceTable<
  typeof kilometricPointColumns
> {
  public constructor(railwaySections: RailwaySectionsTable) {
    super("kilometric_points", kilometricPointColumns, [
      new RailwayReferenceForeignKey(
        [kilometricPointColumns.code_ligne, kilometricPointColumns.rg_troncon],
        railwaySections.name,
        [
          railwaySections.column("code_ligne"),
          railwaySections.column("rg_troncon"),
        ],
      ),
    ]);
    Object.freeze(this);
  }
}

export const RAILWAY_SECTIONS_TABLE = new RailwaySectionsTable();
export const KILOMETRIC_POINTS_TABLE = new KilometricPointsTable(
  RAILWAY_SECTIONS_TABLE,
);
