import { checkArchitecture } from "./architecture/check";

try {
  const violations = checkArchitecture(process.cwd());
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column}: ${violation.message}`,
    );
  }
  if (violations.length > 0) process.exitCode = 1;
  else console.log("Architecture boundaries are valid");
} catch (cause) {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exitCode = 1;
}
