# Feature Context

Read this file before creating or moving feature hooks and their supporting logic.

Keep this context focused on local working rules and reusable lessons. Put
implementation walkthroughs and behavior descriptions in regular documentation;
do not add feature histories or inventories of implemented code here.

## Entry points and implementation

Feature hooks live directly under `src/features` with `use-*.ts` filenames.
Their implementation directories sit beside them:

```text
src/features/
  use-real-location.ts
  use-real-location.test.ts
  real-location/
    real-location-controller.ts
    real-location-source.ts
    real-location-state.ts
  use-simulation.ts
  simulation/
    simulation-context.ts
    simulation-controller.ts
    simulation-provider.tsx
```

Keep hook tests beside their hooks, including platform variants such as
`use-visible-milestones.web.ts`. Controllers, providers, contexts, repositories,
queries, mappings and their tests stay in their owning implementation directories.
An implementation directory may support several hooks. Keep logic already
contained in a hook there; do not create empty folders
or extract helpers solely to match the layout.

Import entry hooks directly, for example `@/features/use-simulation`. Do not add
barrel exports or forwarding wrappers. Keep exported APIs narrow and preserve
dependency direction between feature hooks and their supporting modules.

## Shared hooks and boundaries

Reusable UI and platform hooks belong under `src/hooks`; component-specific hooks
stay beside their components. Feature entry hooks may adapt feature contexts,
compose feature models and coordinate their lifecycles. They must not import
routes or create circular dependencies with their implementation modules.

Primitives and shared UI/platform hooks must not import feature hooks or feature
implementations. Shared UI hooks may depend on platform hooks, never the reverse.
