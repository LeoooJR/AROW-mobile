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
- For dependency or Expo configuration changes, run
  `npx expo install --check` and any focused configuration diagnostic needed by
  the change.
- For Metro, styling, routing, native-module, or platform-boundary changes,
  verify the affected Android and/or web bundle. Exercise device-only behavior
  in Expo Go first, using a development build only when Expo Go cannot support
  the feature.
- Documentation-only changes do not require linting, type checking, tests, or
  bundling unless they also alter executable examples or configuration.

## Design authority

Before changing UI, styling, design tokens, typography, spacing, color, shape,
iconography, motion, interaction feedback, or design-related accessibility, read
and follow [`DESIGN.md`](DESIGN.md). It is the source of truth for all design
decisions and takes precedence over local component, hook, or constants guidance
when design rules conflict.

## Scoped source contexts

Before creating, moving, or modifying files in these directories, read and
follow the matching context:

- [`src/components/CONTEXT.md`](src/components/CONTEXT.md) for components;
- [`src/hooks/CONTEXT.md`](src/hooks/CONTEXT.md) for shared UI and platform hooks;
- [`src/constants/CONTEXT.md`](src/constants/CONTEXT.md) for design tokens.
