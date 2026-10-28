# ADR-0008: Consolidate railway-reference ownership and feature entry hooks

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

Railway filtering and milestone input resolution lived in separate feature
modules, while SQLite retrieval and domain mapping lived in `railway-reference`.
Developers had to cross three modules for one search workflow. Feature entry
hooks were also split between implementation directories and `src/hooks/features`,
making it harder to find a hook and its supporting logic together.

## Decision

Use `src/features/railway-reference` as the single owner of railway-object search
and retrieval. Group filtering, input validation, resolution messages and their
unchanged contracts in `search/`; retain `sqlite/`, `mapping/`, repository,
providers, viewport retrieval and display policy within the same feature.

Keep feature entry hooks directly under `src/features/use-*.ts`, beside the
directories holding their supporting logic, with hook tests and platform
variants colocated. Keep component-specific form hooks beside their components
and reusable UI/platform hooks under `src/hooks`. Do not create empty per-hook
directories or extract logic solely to satisfy the layout.

Preserve existing provider names, hook APIs and shared domain models. Use direct
imports without forwarding wrappers or barrel exports. Consolidation changes
ownership and discoverability, not SQL, validation rules or search results.

## Alternatives

Separate railway and milestone feature modules left very small search-only
folders coupled through contracts to the database feature. Naming the combined
module `railway-search` or `railway-catalogue` was considered; `railway-reference`
also covers neighbours, recorded bounds and viewport retrieval and preserves
existing public names. One folder per hook would add structure without useful
separation for hooks whose logic is already self-contained.

## Consequences

Search, retrieval and mapping have one discoverable owner with internal
responsibility boundaries. Consumers need updated import paths, and the feature
root contains more entry hooks. The module remains broad and needs disciplined
internal dependencies; consolidation does not justify moving UI workflows or
framework-dependent logic into shared domain classes.

## Evidence and related decisions

- [Search workflow and ownership](../search-to-simulation.md#where-to-look-in-code),
  [search contracts](../../src/features/railway-reference/search/contracts.ts),
  [repository](../../src/features/railway-reference/repository.ts) and
  [entry hook](../../src/features/use-railway-reference.ts).
- [Feature working rules](../../src/features/CONTEXT.md) and
  [dependency boundary checks](../../script/architecture/check.ts).
- Organises the retrieval operations described in
  [ADR-0003](0003-precompute-section-totals-and-point-ordinals.md),
  [ADR-0004](0004-load-visible-points-from-sqlite.md) and
  [ADR-0006](0006-reference-recorded-section-endpoints.md).
