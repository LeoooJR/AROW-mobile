# Validate a change

Start with the narrowest relevant checks, then broaden verification in proportion
to the change's risk. Do not report work as complete when an applicable check is
failing or has not been run. State unavailable or intentionally skipped checks
explicitly.

## Choose the applicable checks

- For every changed human-authored file supported by Prettier, run
  `npx prettier --check <files>`. Use `--write` only when formatting changes are
  intended. Markdown is excluded from the aggregate formatting command, so check
  changed documentation with `npx prettier --check --ignore-path /dev/null <files>`.
- For JavaScript or TypeScript changes, run `npm run lint`, `npx tsc --noEmit`,
  and the narrowest relevant tests when tests exist. Follow the
  [code-quality guidance](code-quality.md) for architecture and shared-layer checks.
- Successful Jest or Maestro tests do not replace a live application test.
  Launch and exercise the affected behavior on an Android virtual device before
  reporting application validation as complete. Read the [Android workflow](android.md)
  before operating the device.
- When Maestro E2E testing applies, follow the flow-selection, pass criteria,
  and recording requirements in [Android validation](android.md#maestro-validation).
- For dependency or Expo configuration changes, run `npx expo install --check`
  and any focused configuration diagnostic needed by the change.
- For Metro, styling, routing, native-module, or platform-boundary changes,
  verify the affected Android and/or web bundle. Exercise device-only behavior
  in Expo Go first, using a development build when Expo Go cannot support the
  feature.
- Documentation-only changes do not require linting, type checking, tests, or
  bundling unless they also alter executable examples or configuration.

See the [development guide](../development.md) for setup and local build commands.
