# AROW Mobile agent guide

## Project context

AROW Mobile is an Android application for controlled railway research and
development. It lets users alter the location reported by their phone by
supplying fake GPS coordinates, enabling railway geolocation scenarios to be
developed, simulated, and tested.

AROW stands for **Advanced Railway geOlocation Workflow**. Its one-sentence
product description is: **Google Maps for the railway world, with controlled GPS
location simulation built in.**

The application's primary concepts and workflows come from the railway domain,
including railway milestones, stations, railways, and related geolocation data.
Use railway terminology and semantics when modeling features instead of reducing
them to generic map concepts.

AROW Mobile has a companion desktop application with which it can exchange data.
Preserve that relationship when designing data models, import/export behavior,
or synchronization boundaries; do not assume the mobile application is an
isolated system.

Treat fake-location behavior as an intentional core capability for authorized
research and development, not as incidental test tooling.

## Communication contract

Before changing desktop/mobile data exchange, protocol messages, simulation
commands, applied-state reporting, transport boundaries, or compatibility rules,
read and follow the
[`AROW Mobile communication contract`](docs/HOW_TO_communication_contract).

## Expo version requirement

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## React Native Testing Library in this project

This project uses `@testing-library/react-native`. Its APIs and testing
conventions can differ from your training data. Before writing or changing RNTL
tests, read the relevant guide in
`node_modules/@testing-library/react-native/docs/`, starting with
`node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md`.
Prefer those package docs over stale assumptions, and follow deprecation
notices.

## Validation

Validate every modification with the narrowest relevant checks, then broaden
verification in proportion to the change's risk. Do not report work as complete
when an applicable check is failing or has not been run; state any unavailable
or intentionally skipped check explicitly.

- For every changed human-authored file, run `npx prettier --check <files>`.
  Use the equivalent `--write` command only when formatting changes are
  intended.
- For JavaScript or TypeScript changes, run `npm run lint` and
  `npx tsc --noEmit`, plus the narrowest relevant tests when tests exist.
- Successful Jest or Maestro tests do not replace a live application test.
  Agents must still launch and exercise the affected behavior on an Android
  virtual device before reporting the work as complete.
- When Maestro E2E testing applies, run every configured flow. After the suite
  passes, record and present the flows that exercise the feature produced or
  changed by the work so the user can review it. Do not record unrelated flows.
- For dependency or Expo configuration changes, run
  `npx expo install --check` and any focused configuration diagnostic needed by
  the change.
- For Metro, styling, routing, native-module, or platform-boundary changes,
  verify the affected Android and/or web bundle. Exercise device-only behavior
  in Expo Go first, using a development build only when Expo Go cannot support
  the feature.
- Documentation-only changes do not require linting, type checking, tests, or
  bundling unless they also alter executable examples or configuration.

## Android emulator workflow

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

## Design authority

Before changing UI, styling, design tokens, typography, spacing, color, shape,
iconography, motion, interaction feedback, design-related accessibility, page
architecture, or element placement, read and follow
[`design-prototype/android-home.html`](design-prototype/android-home.html),
[`design-prototype/android-home-dark.html`](design-prototype/android-home-dark.html),
and [`DESIGN.md`](DESIGN.md).

The rendered visual designs expressed by
[`design-prototype/android-home.html`](design-prototype/android-home.html) and
[`design-prototype/android-home-dark.html`](design-prototype/android-home-dark.html)
are the sources of truth for the application's light and dark themes,
respectively. When interpreting the prototypes, focus exclusively on their
design intent, including color, typography, spacing, borders, shapes, sizing,
alignment, element position, visual hierarchy, and page architecture. Their
programming implementation and behavior, including functions, variables, event
handling, and other logic, are not authoritative and must not be copied or
treated as application requirements.

Only the user may modify or override the design prototypes. Agents must not edit
[`design-prototype/android-home.html`](design-prototype/android-home.html) or
[`design-prototype/android-home-dark.html`](design-prototype/android-home-dark.html).
When a theme's prototype and [`DESIGN.md`](DESIGN.md) differ on a visual
decision, follow that theme's prototype; use `DESIGN.md` for complementary
design guidance where the prototypes are silent. These sources take precedence
over local component, hook, or constants guidance when design rules conflict.

## Scoped source contexts

Before creating, moving, or modifying files in these directories, read and
follow the matching context:

- [`src/components/CONTEXT.md`](src/components/CONTEXT.md) for components;
- [`src/hooks/CONTEXT.md`](src/hooks/CONTEXT.md) for shared UI and platform hooks;
- [`src/constants/CONTEXT.md`](src/constants/CONTEXT.md) for design tokens.
