import { resolve } from "node:path";

import type { GenerationSummary } from "./types";

export const DEFAULT_RAILWAY_GEOJSON_PATH = resolve(
  "src/statics/lignes-par-type.geojson",
);
export const DEFAULT_RAILWAY_DATABASE_PATH = resolve(
  "src/statics/railway_reference.sqlite",
);
export const DEFAULT_MILESTONE_GEOJSON_PATH = resolve(
  "src/statics/milestones.geojson",
);

export const EXPECTED_RAILWAY_SNAPSHOT: GenerationSummary = Object.freeze({
  fallbackSectionCount: 2,
  geometryCount: 1043,
  geometryWithoutMilestoneCount: 27,
  milestoneCount: 36812,
  railwaySectionCount: 1045,
  skippedMilestoneCount: 1,
});
