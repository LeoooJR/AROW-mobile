# From railway search to simulation start

This guide follows a user from **Rechercher un point** to a confirmed simulation start. It ends when Android applies the first mock location fix and the app reports `running`. For what happens after that, see the [simulation lifecycle guide](../src/features/simulation/README.md).

```mermaid
flowchart LR
    Open[Open point search] --> Line[Find and choose a railway line]
    Line --> Section[Choose a section if needed]
    Section --> Input[Enter a kilometre and metric part]
    Input --> Resolve[Resolve a Milestone from SQLite]
    Resolve --> Use[Use this point]
    Use --> Selected[Searched milestone selected on map]
    Selected --> Start[Press Start simulation]
    Start --> Ready[Check Android readiness]
    Ready --> Fix[Apply first mock fix from selected Milestone]
    Fix --> Running[Running]
```

The [railway domain glossary](railway-domain.md) defines the shared models,
identities, PK units, and the distinction between ranges and located bounds.

## 1. Search for a railway point

The map toolbar opens the point-search sheet and asks the railway-reference provider to load its searchable lines. The provider reads the bundled SQLite railway reference; the map itself does not perform the search.

The form has three steps:

1. **Line.** Search by the beginning of a line code or by at least two letters of its name. Name search ignores accents and case. Results are limited to 20. Choose a railway line from the results.
2. **Section.** Choose a section of that line. If the line has exactly one section, the form selects it automatically.
3. **Kilometre point.** Enter the kilometre and three-digit metric part, such as `509` and `000` for **PK 509+000**. A complete `509+000` value can also be pasted. The point must fall within the selected section's known range.

For example, searching for code **893000** finds **Ligne de Collonges-Fontaines à Lyon-Guillotière**. Selecting its section **1**, then entering `509` + `000`, requests the point at **509,000 metres** along that section.

[`usePointSearchForm`](../src/components/composites/map-toolbar/point-search-sheet/use-point-search-form.ts) holds the form state. [`searchRailways`](../src/features/railway-reference/search/railway-search.ts) filters the loaded lines, while [`validateMilestoneInput`](../src/features/railway-reference/search/milestone-input.ts) checks the entered point.

## 2. Resolve and select the milestone

Once the input is valid, [`useMilestoneResolution`](../src/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution.ts) calls `findMilestone` with the line code, section rank, and position in metres. The SQLite repository returns a `Milestone` domain object containing its identity, label, and coordinates. A stale result from an earlier input is ignored.

The sheet shows a resolved-point summary, then enables **Utiliser ce point** only when resolution is `ready`. A missing point, out-of-range value, or lookup error does not enable that action.

Pressing **Utiliser ce point** closes the sheet. [`useMapSelection`](../src/features/use-map-selection.ts) records the feature with `purpose: "simulation-target"`, makes the milestone layer visible, and requests camera focus. The selected milestone is highlighted and its [metadata card](map-interactivity.md) appears with the simulation start control available. A map tap alone is inspection; the card's **Utiliser ce point** action can prepare that displayed milestone through the same selection path while keeping the card open.

## 3. Press start

[`useMapLocation`](../src/features/use-map-location.ts) passes the prepared milestone to [`useSimulation`](../src/features/use-simulation.ts). Pressing **Démarrer la simulation** calls the simulation controller, which proceeds in this order:

```text
Check: AROW is the selected mock-location app
Check: Android location services are enabled
Check: fine location permission is granted
        ↓ only if ready
Start the Android executor with the selected Milestone's coordinates
        ↓ only after the first fix is applied
Report running
        ↓ independently, after successful startup
Prepare notification consent and visibility without changing simulation state
```

Start does not repeat the milestone lookup. The selected `Milestone` already contains validated coordinates, and the bundled reference cannot change between selection and start. Readiness runs before native start, so a missing mock-app selection or disabled location services fails quickly without applying a fix. Native start also checks readiness before applying a fix. A start request alone is **not** reported as success.

For the example above, the selected `Milestone` resolves to approximately **45.74744 N, 4.85933 E**. The journey reaches its endpoint only when the native result confirms that those coordinates were applied and the UI enters `running`.

## Where to look in code

The `railway-reference` feature owns railway-object search and retrieval. Its
`search/` directory groups railway filtering, milestone input validation,
resolution messages and their shared search contracts. Component-specific form
state and interaction hooks remain beside the search sheet. The feature entry
hooks remain at the root of `src/features`.

Within railway-reference, `sqlite/reader.ts` executes queries and returns raw rows.
The feature-level repository passes those rows to `mapping/`, where the milestone
and railway mappers validate them with the shared row decoders and construct domain
objects. Railway grouping and sorting also belong to the railway mapper.

| Responsibility                                                       | File                                                                                                                                                      |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open/close the sheet and hand the chosen milestone to the map screen | [`map-toolbar/index.tsx`](../src/components/composites/map-toolbar/index.tsx)                                                                             |
| Form stages, selection, and resolved-point feedback                  | [`point-search-sheet/`](../src/components/composites/map-toolbar/point-search-sheet/)                                                                     |
| Read lines and milestones from the bundled database                  | [`railway-reference/provider.tsx`](../src/features/railway-reference/provider.tsx) and [`repository.ts`](../src/features/railway-reference/repository.ts) |
| Preserve the searched origin and request map focus                   | [`use-map-selection.ts`](../src/features/use-map-selection.ts)                                                                                            |
| Check readiness and confirm start                                    | [`simulation-controller.ts`](../src/features/simulation/simulation-controller.ts)                                                                         |

The [milestone Maestro journey](../.maestro/tests/mock-phone-location.yaml) exercises the search, selection, and fail-fast mock-app check. Its assertions stop before a successful native start, so a change to first-fix acknowledgement also needs a focused Android check.
