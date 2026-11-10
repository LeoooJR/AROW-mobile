import { setupRailwayDatabase } from "./railway-reference/setup";

setupRailwayDatabase().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exitCode = 1;
});
