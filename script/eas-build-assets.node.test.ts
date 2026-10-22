/** @jest-environment node */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const EAS_ASSET_INCLUSIONS = [
  "# Generated railway assets required by EAS Build",
  "!/src/statics/lignes-par-type.geojson",
  "!/src/statics/milestones.geojson",
  "!/src/statics/railway_reference.sqlite",
  "!/src/statics/railway_reference.import-report.json",
].join("\n");

describe("EAS build asset inclusion", () => {
  test("inherits every Git ignore rule before including generated assets", () => {
    const gitignore = readFileSync(resolve(".gitignore"), "utf8").trimEnd();
    const easignore = readFileSync(resolve(".easignore"), "utf8").trimEnd();

    expect(easignore.startsWith(`${gitignore}\n\n`)).toBe(true);
    expect(easignore.endsWith(EAS_ASSET_INCLUSIONS)).toBe(true);
  });

  test("excludes development files while retaining required build inputs", () => {
    const excluded = [
      "design-prototype/android-home.html",
      "docs/HOW_TO_communication_contract",
      ".maestro/artifacts/.gitkeep",
      ".maestro/tests/mock-phone-location.yaml",
      ".agents/skills/frontend-design/SKILL.md",
      ".codex/environments/environment.toml",
      ".vscode/settings.json",
      "skills-lock.json",
      "AGENTS.md",
      "src/components/CONTEXT.md",
      "src/tests/asset-mock.ts",
      "src/features/simulation/simulation-controller.test.ts",
      "script/eas-build-assets.node.test.ts",
      "modules/arow-mock-location/app.plugin.test.js",
      "src/example.spec.tsx",
      "src/__tests__/example.ts",
      "src/__mocks__/example.ts",
      "jest.config.js",
      "eslint.config.js",
      ".github/workflows/ci.yml",
      ".prettierignore",
      "tsconfig.shared.json",
      "script/check-architecture.ts",
      "script/architecture/check.ts",
      "jest.ci.config.js",
      "modules/arow-mock-location/android/build/outputs/classes.jar",
      "modules/arow-mock-location/android/.gradle/cache.bin",
      "modules/arow-mock-location/android/.cxx/build.ninja",
      "assets/images/android-icon-background.png",
      "assets/images/expo-badge.png",
      "assets/images/expo-badge-white.png",
      "assets/images/expo-logo.png",
      "assets/images/logo-glow.png",
      "assets/images/react-logo.png",
      "assets/images/react-logo@2x.png",
      "assets/images/react-logo@3x.png",
      "assets/images/splash-icon.png",
      "assets/images/tutorial-web.png",
      "assets/images/tabIcons/home@2x.png",
    ];
    const required = [
      "package.json",
      "package-lock.json",
      "app.json",
      "metro.config.js",
      "postcss.config.mjs",
      "tsconfig.json",
      "nativewind-env.d.ts",
      "script/check-railway-database.ts",
      "script/railway-database/asset-validation.ts",
      "shared/railway-reference/schema.ts",
      "src/app/_layout.tsx",
      "src/statics/lignes-par-type.geojson",
      "src/statics/milestones.geojson",
      "src/statics/railway_reference.sqlite",
      "src/statics/railway_reference.import-report.json",
      "assets/images/icon.png",
      "assets/images/favicon.png",
      "assets/images/android-icon.png",
      "assets/images/android-icon-foreground.png",
      "assets/images/android-icon-monochrome.png",
      "assets/images/app-icon-dark.png",
      "assets/images/splash-mark.png",
      "assets/expo.icon/icon.json",
      "assets/expo.icon/Assets/grid.png",
      "modules/arow-mock-location/app.plugin.js",
      "modules/arow-mock-location/expo-module.config.json",
      "modules/arow-mock-location/android/build.gradle",
      "modules/arow-mock-location/android/src/main/AndroidManifest.xml",
      "modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationService.kt",
      "modules/arow-mock-location/android/src/main/res/layout/arow_notification_compact.xml",
    ];
    const directory = mkdtempSync(join(tmpdir(), "arow-build-ignore-"));
    try {
      execFileSync("git", ["init", "--quiet", directory]);
      writeFileSync(
        join(directory, ".gitignore"),
        readFileSync(resolve(".easignore")),
      );
      const ignored = execFileSync(
        "git",
        ["-C", directory, "check-ignore", "--no-index", "--stdin"],
        {
          input: [...excluded, ...required].join("\n") + "\n",
          encoding: "utf8",
        },
      )
        .trim()
        .split("\n");

      expect(ignored).toEqual(excluded);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
