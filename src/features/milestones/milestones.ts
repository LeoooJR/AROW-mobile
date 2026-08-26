import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import type { Feature, FeatureCollection, Point } from "geojson";

export interface MilestoneProperties {
  readonly codeLigne: number;
  readonly kilometer: number;
  readonly label: string;
  readonly latitude: number;
  readonly ligne: string;
  readonly longitude: number;
  readonly sectionRank: number;
}

export type MilestoneFeature = Feature<Point, MilestoneProperties>;
export type MilestoneFeatureCollection = FeatureCollection<
  Point,
  MilestoneProperties
>;

export type MilestoneState =
  | { readonly status: "loading" }
  | {
      readonly collection: MilestoneFeatureCollection;
      readonly status: "ready";
    }
  | { readonly status: "error" };

interface MilestoneDatabaseRow {
  readonly code_ligne: number;
  readonly km: number;
  readonly label: string;
  readonly latitude: number;
  readonly ligne: string;
  readonly longitude: number;
  readonly rg_troncon: number;
}

const MILESTONE_QUERY = `
  SELECT ligne, code_ligne, km, label, rg_troncon, latitude, longitude
  FROM kilometric_points
`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isCoordinate(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function parseMilestoneDatabaseRow(
  value: unknown,
  index: number,
): MilestoneDatabaseRow {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.ligne) ||
    !isInteger(value.code_ligne) ||
    !isInteger(value.km) ||
    !isNonEmptyString(value.label) ||
    !isInteger(value.rg_troncon) ||
    !isCoordinate(value.latitude, -90, 90) ||
    !isCoordinate(value.longitude, -180, 180)
  ) {
    throw new Error(`Invalid milestone at row ${index}`);
  }

  return {
    code_ligne: value.code_ligne,
    km: value.km,
    label: value.label,
    latitude: value.latitude,
    ligne: value.ligne,
    longitude: value.longitude,
    rg_troncon: value.rg_troncon,
  };
}

export function milestoneRowsToFeatureCollection(
  rows: readonly unknown[],
): MilestoneFeatureCollection {
  return {
    features: rows.map((value, index) => {
      const row = parseMilestoneDatabaseRow(value, index);

      return {
        geometry: {
          coordinates: [row.longitude, row.latitude],
          type: "Point",
        },
        id: `${row.code_ligne}:${row.rg_troncon}:${row.km}`,
        properties: {
          codeLigne: row.code_ligne,
          kilometer: row.km,
          label: row.label,
          latitude: row.latitude,
          ligne: row.ligne,
          longitude: row.longitude,
          sectionRank: row.rg_troncon,
        },
        type: "Feature",
      } satisfies MilestoneFeature;
    }),
    type: "FeatureCollection",
  };
}

export function useMilestones(): MilestoneState {
  const database = useSQLiteContext();
  const [state, setState] = useState<MilestoneState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadMilestones(): Promise<void> {
      try {
        const rows = await database.getAllAsync<unknown>(MILESTONE_QUERY);
        const collection = milestoneRowsToFeatureCollection(rows);

        if (active) {
          setState({ collection, status: "ready" });
        }
      } catch {
        if (active) {
          setState({ status: "error" });
        }
      }
    }

    void loadMilestones();

    return () => {
      active = false;
    };
  }, [database]);

  return state;
}
