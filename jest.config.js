/** @type {import("jest").Config} */
module.exports = {
  preset: "jest-expo",
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "src/hooks/**/*.{ts,tsx}",
    "src/features/**/*.{ts,tsx}",
    "shared/**/*.{ts,tsx}",
    "!**/*.{test,spec}.{ts,tsx}",
    "!**/{__tests__,__mocks__}/**",
    "!**/*.d.ts",
    "!**/types.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "\\.geojson$": "<rootDir>/src/tests/asset-mock.ts",
    "\\.sqlite$": "<rootDir>/src/tests/asset-mock.ts",
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
};
