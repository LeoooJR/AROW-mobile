# ADR-0006: Reference recorded section endpoints with deferred foreign keys

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

Source geometry PKD/PKF labels do not reliably identify recorded points, even
when supported numerical marker types are considered more broadly. Showing these
limits alongside a map and search backed by different recorded limits was
misleading. Catalogue loading also aggregated the points to rediscover extrema.

## Decision

Keep the two-table design. Replace application-schema `pkd` and `pkf` with
nullable numerical `first_recorded_position_m` and `last_recorded_position_m`,
derived from the same accepted points as each section's count.

Each endpoint is a composite foreign key containing line code, section rank and
position, referencing the point primary key. Declare both
`DEFERRABLE INITIALLY DEFERRED`; retain the point-to-section foreign key and
foreign-key enforcement. Generation inserts sections and then points in one
transaction, accepting the relationship cycle and checking it at commit.

Empty sections require two null endpoints. Nonempty sections require ordered,
non-negative endpoints; single-point sections reference the same point twice.
Independently recompute extrema: foreign keys prove existence, not extremeness.

Replace the catalogue's grouped point scan with a section scan and two exact
primary-key joins. Resolve located bounds from one section lookup and its stored
references. Fetch labels and coordinates from the points, without cached labels
or extra endpoint indexes. A single-point bounds query returns one row.

Remove declared geometry PK labels from runtime geometry metadata and generated
line GeoJSON, leaving raw sources unchanged. Search and map details use recorded
limits, including sections without geometry. Those limits do not redefine
geometry or guarantee intermediate records exist.

## Alternatives

Retaining PKD/PKF as recorded bounds preserves an unreliable relationship.
Runtime aggregation repeats work on immutable data. A separate endpoint-metadata
table could remove the schema cycle but adds another table and joins; deferred
constraints preserve integrity within the existing two-table model.

## Consequences and evidence

Generation must satisfy the complete cyclic relationship before commit, and
derived values require independent validation. Runtime retrieval becomes simpler.
Historical desktop comparison reported catalogue loading at 65.38 ms before and
5.27 ms after; bounds medians changed from 15.50 to 13.44 microseconds. The final
schema-5 asset was approximately 29.47 MiB. The
[database guide](../railway-database.md#point-visibility-classes-and-geographic-index)
records Node 24.18.0, SQLite 3.53.1, a 2 MiB cache and 30 alternating rounds with
complete row materialization. These are desktop observations, not Android SLAs.

- [Schema](../../shared/railway-reference/schema.ts),
  [independent extrema validation](../../script/railway-database/section-endpoints.ts)
  and [runtime joins](../../src/features/railway-reference/sqlite/queries.ts).
- Extends [section totals](0003-precompute-section-totals-and-point-ordinals.md)
  and uses [versioned imports](0001-generate-and-version-the-reference-asset.md).
