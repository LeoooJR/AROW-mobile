# Maestro test context

These instructions apply to the Maestro configuration and flows under
`.maestro/`.

Keep this context about authoring, running and maintaining journeys. Put product
walkthroughs and past validation results in regular documentation or review
artifacts. Add lessons here as reusable test-maintenance rules.

## Journey maintenance

- Use `journeys/` for end-to-end user goals, `features/` for focused regression
  checks, `subflows/` for reusable units, and `setup/` for system preparation.
  Give executable flows a unique name and the matching `journey`, `feature`, or
  `setup` tag. Subflows are never suite entry points. Include setup in the suite
  only by explicit filename. `npm run check:validation` enforces this layout,
  parses YAML, and checks flow references, cycles, and ordered names.
- State preconditions and persistent device changes in each executable flow.
  Include cleanup for temporary changes on success and failure, or explicitly
  document the manual restoration required. Setup flows intentionally establish
  state; name that state. Do not depend on an undocumented preceding test.
- Shared preparation must fail when startup fails. Do not add retries or press
  Retry in subflows. Recovery belongs in a named scenario with assertions before
  and after the user retries. Do not relax assertions to accommodate tool hangs.
- Use `launchApp` with `permissions: {}` when permission state is under test,
  then the strict map-ready subflow. Connect a development client to its saved
  project once. Do not send repeated Expo development URLs to recover startup;
  they can restart the runtime and confound the scenario.
- Keep device diagnostics separate from UI assertions. A visible running label
  does not prove injection; a Stop button disappearing does not prove native
  cleanup. Describe the guarantees of each maintained command and any separate
  local checks. Never link maintained coverage to ignored diagnostic scripts.
- Selector `checked` values must be literal booleans. For an environment-driven
  choice, branch using `runFlow.when.true` and use a literal selector in each branch.

- Model tests as durable, goal-driven user journeys. Evolve an existing flow as
  its product workflow grows instead of documenting or naming it after one
  temporary implementation stage.
- Treat `.maestro/config.yaml` as the source of truth for the configured suite
  and execution order.
- Select flows according to the changed behavior, their assertions, and
  plausible regressions in affected code paths. Explain the selection before
  running it and require every selected flow to pass. Follow the validation
  guidance in `AGENTS.md`; run the complete configured suite only when the
  change's scope warrants it or the user requests it. Report the flows run and
  any coverage gaps requiring focused live checks.
- Keep device selection explicit when more than one Android target may be
  connected. Automated local runs must target an `emulator-*` serial and must
  not select a physical device.

## Recording

Follow the user's requested evidence format. If they request screenshots only
or no recording, do not run the recording commands below.

Record only the flows that exercise the feature being delivered. All selected
validation flows must pass before recording. Run these commands from the repository root,
with `maestro` and `adb` available on `PATH`; project rules must not encode a
coworker's home directory or local Android SDK installation path.

Use Maestro's local recorder first. Give each recorded feature flow a stable,
dedicated review artifact:

```bash
maestro --device emulator-5554 record --local .maestro/journeys/mock-phone-location.yaml .maestro/artifacts/arow-e2e-recording.mp4
```

For the standalone map-feature selection flow:

```bash
maestro --device emulator-5554 record --local .maestro/features/manage-map-feature-selection.yaml .maestro/artifacts/map-feature-selection-e2e-recording.mp4
```

For the standalone map-layer feature flow:

```bash
maestro --device emulator-5554 record --local .maestro/features/manage-map-layers.yaml .maestro/artifacts/map-layers-e2e-recording.mp4
```

For the standalone map-focus feature flow:

```bash
maestro --device emulator-5554 record --local .maestro/features/manage-map-focus.yaml .maestro/artifacts/map-focus-e2e-recording.mp4
```

Present the video only when the recorded flow passes. If Maestro's local
recorder fails or cannot render a usable video, use ADB as the fallback. Start
the emulator recording, run the same Maestro flow in another terminal, and stop
the recording with `Ctrl+C` only after the flow passes:

```bash
adb -s emulator-5554 shell screenrecord --bit-rate 2000000 /sdcard/arow-e2e-recording.mp4
```

```bash
maestro --device emulator-5554 test .maestro/journeys/mock-phone-location.yaml
```

Then copy the fallback recording to the host for review:

```bash
adb -s emulator-5554 pull /sdcard/arow-e2e-recording.mp4 .maestro/artifacts/arow-e2e-recording.mp4
```

Do not use ADB recording before trying Maestro's local recorder. Do not present
a recording from a failed flow. Files under `.maestro/artifacts/` are local
review outputs and are intentionally excluded from version control.
