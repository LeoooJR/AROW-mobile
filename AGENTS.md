# AROW Mobile agent entry point

AROW Mobile is an Android railway map with controlled GPS simulation for railway
research and development. Use railway terminology and semantics; simulation is
an intentional core capability. Preserve the relationship with AROW Desktop.

## Load guidance for the task

Read the matching guides **before acting**. Multiple rows may apply. Load only
what the task needs; do not read every linked guide by default.

| Task                                                                                               | Required guidance                                                                                                                      |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Any change                                                                                         | [Validation](docs/agents/validation.md)                                                                                                |
| Writing code                                                                                       | [Exact Expo SDK 57 documentation](https://docs.expo.dev/versions/v57.0.0/) before writing any code                                     |
| JavaScript/TypeScript or architecture changes                                                      | [Code-quality boundaries](docs/agents/code-quality.md)                                                                                 |
| Railway models, identities, or reference-data mapping                                              | [Railway vocabulary and ownership](docs/railway-domain.md)                                                                             |
| Desktop/mobile exchange, simulation commands, applied-state reporting, transport, or compatibility | [Communication contract](docs/HOW_TO_communication_contract)                                                                           |
| UI, styling, tokens, typography, icons, motion, interaction feedback, accessibility, or layout     | [Design authority](docs/agents/design.md)                                                                                              |
| Creating, moving, or modifying components; acquiring Gluestack components                          | [Component context](src/components/CONTEXT.md)                                                                                         |
| Map adapter changes                                                                                | Also read [map adapter context](src/components/adapters/map/CONTEXT.md)                                                                |
| Shared hooks under `src/hooks`                                                                     | [Hook context](src/hooks/CONTEXT.md)                                                                                                   |
| Files under `src/constants`                                                                        | [Constants context](src/constants/CONTEXT.md)                                                                                          |
| Writing or changing RNTL tests                                                                     | [Installed RNTL guide](node_modules/@testing-library/react-native/docs/guides/llm-guidelines.md), then relevant installed package docs |
| Android device validation, ADB, SDK, emulator, or Metro operations                                 | [Android workflow and authorization](docs/agents/android.md)                                                                           |
| Maestro journeys or recordings                                                                     | [Android validation](docs/agents/android.md) and [Maestro context](.maestro/CONTEXT.md)                                                |

## Always preserve

- Only the user may edit or override design prototypes.
- Never install or run the `gluestack-ui` CLI. Acquire components using the
  official **Manual** instructions described in the component context.
- Validate changes proportionately and disclose failed, unavailable, or skipped
  checks. The validation guide defines which checks apply.

For local setup and build commands, consult the [development guide](docs/development.md)
when needed.
