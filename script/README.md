# Repository tooling

Keep tools with the environment and responsibility they serve. Run commands from
the repository root. These tools do not belong to the mobile application's
runtime source.

| Area           | Responsibility                                                                                                         | Sent to EAS Build? |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------ |
| `build/`       | Build entry points; verify the bundled railway GeoJSON and SQLite before native compilation                            | Yes                |
| `shared/`      | Node-only railway asset contracts, normalization, and read-only database validation used by build and data preparation | Yes                |
| `data/`        | Download pinned sources, generate reference assets and import reports, and validate the complete local audit trail     | No                 |
| `ci/`          | Architecture rules, validation-tooling checks, and EAS archive contract tests                                          | No                 |
| `development/` | Local Android builds, release previews, and Metro startup                                                              | No                 |
| `local/`       | Disposable task-specific investigations; only `.gitkeep` is tracked                                                    | No                 |

Live application tests remain in [`.maestro/`](../.maestro/README.md), with their
own journeys, features, setup, and reusable subflows. `ci/` checks their structure
without running a device. `development/` prepares a local build/server; it does
not establish that a live test passed. Read the [Android workflow](../docs/agents/android.md)
before device operations.

## Commands and environments

| Command                          | Intended use                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `npm run database:setup`         | Local data preparation; downloads pinned inputs and stages/validates outputs before promotion                |
| `npm run database:check`         | Full local data validation, including the import report; used before development and dataset-dependent tests |
| `npm run build:check-assets`     | Offline verification of the two assets shipped with the application                                          |
| `npm run eas-build-post-install` | EAS lifecycle hook; runs only `build:check-assets` and needs no importer or report                           |
| `npm run check`                  | Local/CI architecture, validation layout, formatting, lint, and type checks                                  |
| `npm run test:ci`                | Asset-independent Jest tests; no dataset download, Metro, or emulator                                        |
| `npm test`                       | Full local Jest tests, with the normal dataset precheck                                                      |
| `npm run test:e2e`               | Live Maestro tests; requires explicit device preparation and scenario selection                              |

GitHub Actions runs `check` and `test:ci` in separate jobs. It does not download
production datasets or run an emulator. Node HTTP integration tests use temporary
loopback servers and require permission to listen on localhost.

The local shell entry points live in `development/`. They require an explicit,
already booted AVD for build/install operations. `script/build_and_run.sh` remains
a small compatibility launcher for existing generated Codex actions and approval
rules; new documentation uses the canonical `development/` paths.

## Dependencies and upload boundary

`build/` may import its own modules, `script/shared/`, root `shared/`, and Node
built-ins. `script/shared/` may import its own modules, root `shared/`, and Node
built-ins. Neither area may import data preparation, CI, development helpers,
application modules, or third-party runtime packages. Data preparation uses
shared validators rather than importing build entry points. Application code
must not import repository tooling. `npm run check:architecture` enforces these
boundaries, including type-only imports. Keep import specifiers literal so the
checker can resolve the uploaded dependency graph.

`.easignore` excludes `script/*` by default and admits only `build/` and `shared/`.
Tests and Markdown are still excluded by the global rules. Put a new tool in its
owning area: normal additions need no ignore-file change. A genuinely new area
needs an explicit ownership/boundary decision and starts excluded from EAS.

The import report remains local. Local data validation still requires it; the
remote hook verifies only the GeoJSON and SQLite actually included in the
archive. The reference-data policy, schema checks, pinned snapshot, and generated
outputs remain unchanged.

Run `npm run test:eas-archive` after preparing the railway assets. The
[archive check](ci/check-eas-build-archive.ts) uses the pinned EAS CLI to copy a
fixture with the generated runtime assets. It checks inclusion and exclusion
rules and runs the actual post-install hook from the copied tree. Fixture-based
data tests cover the asset validator in CI without the generated dataset.

## Local experiments

Tracked scripts are reusable project tooling. A script needed only to investigate a task belongs in
`script/local/`. Only its `.gitkeep` is versioned; Git, EAS, lint, formatting,
TypeScript, architecture checks, and test discovery exclude its contents.

Use repository-relative paths and explicit emulator serials. Save diagnostic
outputs in `.maestro/artifacts/`, not alongside maintained sources. Do not link
tracked documentation or tests to a local script: it will be absent from a
fresh checkout. Preserve useful conclusions as concise coverage limitations or
reusable instructions.

Maintained code and tests must not import local scripts; the architecture check
rejects those dependencies even when the experiment happens to exist locally.

Promote an experiment only when there is a recurring project need, a stable
interface, appropriate tests, and an explicit maintained validation command.
Then move it into the owning area and document exactly which guarantees it checks.
`npm run check:validation` rejects task-local files added with `git add -f`.
