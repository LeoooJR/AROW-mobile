# Android workflow and validation

Read this guide before operating an Android device, emulator, ADB, Metro, or the
Android SDK for a task. Build and launch commands live in the
[development guide](../development.md).

## Emulator authorization

Treat a running Android emulator as disposable development infrastructure, not
as a user-owned physical device. Once the target has been confirmed as an
emulator (for example, its ADB serial starts with `emulator-`), agents have
standing authorization to perform reversible testing operations without asking
the user for approval.

Emulator operations that do not require approval include:

- listing, starting, stopping, and inspecting configured emulators;
- building, installing, reinstalling, uploading, and launching development or
  test APKs;
- starting, stopping, reconnecting, and reloading Metro or an Expo development
  client;
- using ADB to tap, type, swipe, navigate, press keys, open activities, force
  stop test apps, configure port forwarding, and read logs;
- inspecting the UI hierarchy and capturing or reading screenshots;
- setting temporary test state such as mock coordinates, theme, orientation,
  network conditions, and reversible runtime permissions.

Do not request approval merely because one of these commands needs access to
ADB, the Android SDK, emulator metadata, or the emulator process. When a real
device and an emulator are connected simultaneously, always pass the explicit
emulator serial or device identifier so commands cannot reach the real device.

This standing authorization does not cover:

- any operation targeting a physical Android device;
- wiping emulator or application data, factory resets, deleting an AVD,
  removing irreplaceable emulator files, or other destructive or irreversible
  actions;
- installing or updating host SDKs, tools, system packages, or dependencies;
- changing host security settings, credentials, signing material, or unrelated
  project state.

For those operations, follow the normal approval and destructive-action rules.
If the target cannot be proven to be an emulator, treat it as a physical device
and ask before mutating it.

## Maestro validation

Read [`.maestro/CONTEXT.md`](../../.maestro/CONTEXT.md) before changing or running
journeys or creating recordings. It contains the commands and maintenance rules.

Select flows that exercise the changed behavior and plausible regressions.
Inspect their assertions and the affected code paths, then briefly explain the
selection before running them. Do not run the entire configured suite by default.

For example, a simulation native-contract change requires
`.maestro/tests/mock-phone-location.yaml`; map selection, layer visibility, and
map-only flows are required only if their behavior may be affected. Expand the
selection when shared behavior changes, or run the entire suite when the scope
warrants it or the user requests it.

Every selected flow must pass before reporting task validation as successful.
Report which flows ran and any coverage gaps requiring focused live checks.

After the selected flows pass, record and present the flows that exercise the
feature produced or changed by the work so the user can review it. Use Maestro's
local recorder first. Use ADB `screenrecord` only when Maestro recording fails,
and rerun the same passing flow while fallback recording is active. Do not
record unrelated flows or present a recording from a failed run. Follow any
explicit user instruction about recording, including requests for no recording.
