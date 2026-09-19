import { validateRailwayAssets } from "./railway-database/asset-validation";

try {
  validateRailwayAssets();
  console.log("Railway reference assets are ready");
} catch (cause: unknown) {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exitCode = 1;
}
