# Enforced code-quality boundaries

Read this guide for JavaScript/TypeScript and architecture changes. CI enforces
these rules through the [architecture checker](../../script/architecture/check.ts),
lint, formatting, and type checks.

## Dependency and filename rules

- `shared` contains `.ts` source only and imports only other shared modules or
  Node built-ins, including type-only imports. Computed imports are prohibited.
- `src/utils` uses `.ts` source only. Its existing application and framework
  imports are permitted.
- `src/components/primitives` uses `.tsx` source only, including helpers and
  tests. Primitives cannot import routes, composites, feature implementations,
  feature hooks, or application contexts.
- UI/platform hooks cannot import feature implementations, feature hooks,
  railway-domain/reference modules, or components. Platform hooks cannot import
  UI hooks.
- Gluestack package imports belong in component adapters; MapLibre package
  imports belong in the map adapter. Integration-test mocks are permitted.

Filename rules and shared restrictions also cover tests. Other dependency rules
apply to production code.

## Commands and CI scope

Run `npm run check` for architecture, formatting, lint, application types, and
isolated shared types. Run `npm run test:ci` for asset-independent code tests;
ordinary `npm test` retains its dataset precheck and production-asset suites.

CI does not prepare production datasets or export bundles. This does not remove
the task-specific local checks required by the [validation guide](validation.md).
See [development and testing](../development.md#code-quality-and-testing) for
details about commands and the CI test selection.
