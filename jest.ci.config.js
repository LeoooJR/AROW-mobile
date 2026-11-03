const base = require("./jest.config");

module.exports = {
  ...base,
  // Production snapshots belong to dataset validation, not code-quality CI.
  testPathIgnorePatterns: [
    ...base.testPathIgnorePatterns,
    "<rootDir>/src/statics/lignes-par-type\\.test\\.js$",
    "<rootDir>/src/features/railway-reference/sqlite/bundled-schema\\.node\\.test\\.ts$",
  ],
};
