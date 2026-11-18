import { dirname, join } from "node:path";
import {
  DEFAULT_RAILWAY_DATABASE_PATH,
  EXPECTED_RAILWAY_SNAPSHOT,
} from "../../shared/railway-reference/configuration";
import {
  validateBundledRailwayAssets,
  validationFailure,
  type RailwayAssetValidationOptions,
} from "../../shared/railway-reference/asset-validation";
import { validateImportReport } from "./import-report";

export function validateRailwayAssets(
  options: RailwayAssetValidationOptions = {},
): void {
  validateBundledRailwayAssets(options);
  const databasePath = options.databasePath ?? DEFAULT_RAILWAY_DATABASE_PATH;
  const expectedSnapshot =
    options.expectedSnapshot ?? EXPECTED_RAILWAY_SNAPSHOT;
  try {
    validateImportReport(
      join(dirname(databasePath), "railway_reference.import-report.json"),
      expectedSnapshot,
    );
  } catch (cause) {
    throw validationFailure("Railway import report", cause);
  }
}
