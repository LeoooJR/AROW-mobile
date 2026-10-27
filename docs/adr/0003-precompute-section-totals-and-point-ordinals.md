# ADR-0003: Precompute section totals and point ordinals

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

The point details counter needs its ordinal and the total number of recorded
points in the section. The former current-marker query calculated these using
counting subqueries on every lookup, although the packaged dataset never changes
while the application runs. Numerical PK gaps make distance unsuitable as an
ordinal.

## Decision

During generation, group accepted, deduplicated points by
`(code_ligne, rg_troncon)` and sort numerically by `position_m`. Store consecutive
one-based `kilometric_points.position_in_section` values and the actual
`railway_sections.milestone_count`. Geometry-only sections have count zero;
sections without geometry still have accurate totals.

Resolve the current point by its composite primary key and join its parent
section on both identity columns. Return the stored ordinal and expose
`milestone_count` through the existing `total` result. Keep previous/next lookups
as indexed numerical-PK range queries, with no wrapping or navigation API change.

Independently recompute counts and numeric ordinals during asset validation,
including detecting swapped ordinals that remain within valid bounds. Retain
mapper validation that `1 <= positionInSection <= total`.

## Alternatives

Runtime counts avoid stored derived values but repeat work for fixed data.
Deriving position from PK distance produces incorrect counters for gaps and
irregular points. Runtime triggers or writes are unnecessary for this immutable
asset.

## Consequences

The counter's metadata lookup uses exact point and section lookups instead of
counting section records. Stored integers increase asset size and must be
regenerated when accepted points change. Counters continue to describe all
recorded points, independently of map density or geometry length.

## Evidence and related decisions

- [Ordinal generation](../../script/railway-database/milestone-metadata.ts),
  [section insertion and validation](../../script/railway-database/database.ts)
  and [runtime queries](../../src/features/railway-reference/sqlite/queries.ts).
- [Navigation integration tests](../../src/features/railway-reference/milestone-neighbours.node.test.ts).
- Relies on [immutable generation](0001-generate-and-version-the-reference-asset.md)
  and the [accepted-point policy](0002-import-numerical-pks-with-audited-first-occurrence-deduplication.md).
  [ADR-0006](0006-reference-recorded-section-endpoints.md) extends section metadata
  to recorded endpoint references.
