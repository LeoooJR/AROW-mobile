import { resolve } from "node:path";

import type { GenerationSummary } from "./types";

export const DEFAULT_RAILWAY_GEOJSON_PATH = resolve(
  "src/statics/lignes-par-type.geojson",
);
export const DEFAULT_RAILWAY_DATABASE_PATH = resolve(
  "src/statics/railway_reference.sqlite",
);

export const EXPECTED_RAILWAY_SNAPSHOT: GenerationSummary = Object.freeze({
  duplicateMilestoneCount: 908,
  fallbackSectionCount: 13,
  geometryCount: 1043,
  geometryWithoutMilestoneCount: 3,
  milestoneCount: 371734,
  railwaySectionCount: 1056,
  skippedMilestoneCount: 181,
});
