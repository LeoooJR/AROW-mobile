import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { delimiter, dirname, join, resolve } from "node:path";
import { env } from "node:process";

const requireFromProject = createRequire(resolve("package.json"));

async function checkEasBuildArchive(): Promise<void> {
  // npm exec adds the pinned CLI's bin directory to PATH.
  const searchPath: string = env.PATH ?? "";
  const easPackage = searchPath
    .split(delimiter)
    .map((bin) => resolve(bin, "../eas-cli/package.json"))
    .find((file) => existsSync(file));
  assert(easPackage, "Run npm run test:eas-archive to provide the EAS CLI.");
  const {
    makeShallowCopyAsync,
  }: {
    makeShallowCopyAsync(source: string, destination: string): Promise<void>;
  } = requireFromProject(join(dirname(easPackage), "build/vcs/local.js"));

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

  const directory = mkdtempSync(join(tmpdir(), "arow-eas-archive-"));
  try {
    const source = join(directory, "source");
    const archive = join(directory, "archive");
    const actualInputs = [
      ".easignore",
      "package.json",
      "script/build",
      "script/shared",
      "shared",
      "src/statics/lignes-par-type.geojson",
      "src/statics/railway_reference.sqlite",
    ];
    for (const path of actualInputs) {
      assert(
        existsSync(path),
        `Missing ${path}. Run npm run database:setup to prepare the railway assets.`,
      );
      cpSync(path, join(source, path), { recursive: true });
    }
    // Archive rules also cover file names that need not exist in the checkout.
    for (const path of [...excluded, ...required]) {
      const fixture = join(source, path);
      if (existsSync(fixture)) continue;
      mkdirSync(dirname(fixture), { recursive: true });
      writeFileSync(fixture, "");
    }

    await makeShallowCopyAsync(source, archive);
    for (const path of excluded) {
      assert(
        !existsSync(join(archive, path)),
        `Unexpected EAS archive entry ${path}`,
      );
    }
    for (const path of required) {
      assert(
        existsSync(join(archive, path)),
        `Missing EAS archive entry ${path}`,
      );
    }

    // EAS runs the hook after dependency installation.
    symlinkSync(
      resolve("node_modules"),
      join(archive, "node_modules"),
      "junction",
    );
    execFileSync("npm", ["run", "eas-build-post-install"], {
      cwd: archive,
      stdio: "inherit",
    });
    console.log("EAS archive and post-install hook passed.");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

void checkEasBuildArchive().catch((cause: unknown) => {
  console.error(cause instanceof Error ? cause.message : cause);
  process.exitCode = 1;
});
