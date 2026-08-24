# Shared project rules

These command rules are committed with the repository and are intended for all
AROW contributors. Run matching commands from the repository root and expose
`adb`, `android`, `maestro`, `npx`, and other required tools through `PATH`.
Never add a coworker's home directory, SDK installation path, or host-specific
temporary directory to a project rule.

The Android rules deliberately allow only explicit `emulator-*` serials so a
command cannot silently target a connected physical device. When the supported
emulator range changes, update the serial collections and their `match` and
`not_match` examples together. Keep generated screenshots and recordings under
`.maestro/artifacts/`, which is excluded from version control.

After changing a rule, validate representative allowed and rejected commands
with `codex execpolicy check`, loading every file in this directory. A rejected
physical-device example must remain unmatched.
