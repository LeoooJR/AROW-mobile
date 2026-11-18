import { validateBundledRailwayAssets } from "../shared/railway-reference/asset-validation";

try {
  validateBundledRailwayAssets();
  console.log("Bundled railway assets are ready");
} catch (cause: unknown) {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exitCode = 1;
}
