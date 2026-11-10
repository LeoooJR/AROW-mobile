/** @jest-environment node */

import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

describe("EAS build inputs", () => {
  test("uploads only build/shared tooling and runtime assets, including future files by area", () => {
    const excluded = [
      "script/ci/check-architecture.ts",
      "script/ci/new-check.ts",
      "script/data/railway-reference/setup.ts",
      "script/data/future-importer.ts",
      "script/development/build_dev_client.sh",
      "script/local/.gitkeep",
      "script/local/probe.ts",
      "script/build_and_run.sh",
      "script/future-area/tool.ts",
      "script/shared/railway-reference/example.test.ts",
      "script/build/example.spec.ts",
      "src/statics/railway_reference.import-report.json",
      "src/statics/milestones.geojson",
      ".env",
      ".env.production",
      "credentials.json",
      "service-account-prod.json",
      "release.keystore",
      "docs/development.md",
      "design-prototype/android-home.html",
      ".maestro/journeys/mock-phone-location.yaml",
      ".github/workflows/ci.yml",
      "src/tests/asset-mock.ts",
      "modules/arow-mock-location/android/build/output.jar",
    ];
    const required = [
      "package.json",
      "package-lock.json",
      "app.json",
      "script/build",
      "script/shared",
      "script/shared/railway-reference",
      "script/build/check-railway-assets.ts",
      "script/build/future-check.ts",
      "script/shared/railway-reference/asset-validation.ts",
      "script/shared/railway-reference/database-validation.ts",
      "script/shared/future-helper.ts",
      "shared/railway-reference/schema.ts",
      "src/app/_layout.tsx",
      "src/statics/lignes-par-type.geojson",
      "src/statics/railway_reference.sqlite",
      "assets/images/icon.png",
      "modules/arow-mock-location/app.plugin.js",
      "modules/arow-mock-location/android/src/main/AndroidManifest.xml",
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

  test("the actual EAS hook resolves from uploaded tooling and fails closed on missing assets", () => {
    const directory = mkdtempSync(join(tmpdir(), "arow-build-hook-"));
    try {
      cpSync("package.json", join(directory, "package.json"));
      cpSync("script/build", join(directory, "script/build"), {
        recursive: true,
      });
      cpSync("script/shared", join(directory, "script/shared"), {
        recursive: true,
      });
      cpSync("shared", join(directory, "shared"), { recursive: true });
      symlinkSync(
        resolve("node_modules"),
        join(directory, "node_modules"),
        "dir",
      );
      const result = spawnSync("npm", ["run", "eas-build-post-install"], {
        cwd: directory,
        encoding: "utf8",
      });
      expect(result.error).toBeUndefined();
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        "Railway GeoJSON asset is missing or invalid",
      );
      expect(result.stderr).not.toContain("Cannot find module");
      expect(result.stderr).not.toContain("ERR_MODULE_NOT_FOUND");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
