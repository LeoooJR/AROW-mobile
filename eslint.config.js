// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const globals = require("globals");
const testingLibrary = require("eslint-plugin-testing-library");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ...testingLibrary.configs["flat/react"],
    files: [
      "**/__tests__/**/*.{js,jsx,ts,tsx}",
      "**/*.{spec,test}.{js,jsx,ts,tsx}",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      ...testingLibrary.configs["flat/react"].rules,
      // RNTL v14 fireEvent APIs are async; the React preset models them as sync.
      "testing-library/no-await-sync-events": "off",
    },
  },
  {
    files: ["src/hooks/**/*.{spec,test}.{js,jsx,ts,tsx}"],
    rules: {
      // The generic rule does not distinguish renderHook results from render results.
      "testing-library/render-result-naming-convention": "off",
    },
  },
  {
    ignores: ["dist/*", "node_modules/*", "/.expo"],
  },
]);
