# ADR-0001: Generate and version an immutable reference asset

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

The railway reference is generated before packaging and has no application-time
writes. Repeated reads dominate the workload. Schema and dataset changes must
reach existing installations without clearing unrelated application data, while
failed generation must not replace usable assets.

## Decision

Generate the SQLite reference, railway geometry GeoJSON and import audit before
packaging. Use shared schema descriptors for the two `STRICT`, `WITHOUT ROWID`
tables, keyed by section identity and section-plus-numerical-PK identity.
Composite identities distinguish repeated ranks across lines and repeated PKs
across sections. `WITHOUT ROWID` stores rows by that natural primary key rather
than maintaining a separate rowid identity. `STRICT` types and checks constrain
stored values without replacing semantic validation.
Generate the database transactionally with foreign-key enforcement, then
independently validate staged outputs before promotion. Promotion restores
previous outputs on failure. Source hashes, record consistency and derived
metadata checks make regeneration a controlled publication step.

Keep the bundled database filename stable. Import it on device under a name
containing independent schema and data versions. At recording, these are schema
5 and data revision 2: `railway_reference_v5_r2.sqlite`. The native provider reuses
that copy on subsequent launches rather than overwriting it. Increment the data
revision for changed accepted data without a schema change; increment the schema
version for incompatible structure changes.

## Alternatives

- A fixed device filename can silently reuse an obsolete imported asset.
- Overwriting on every launch adds unnecessary startup I/O.
- Runtime migrations or metadata writes add lifecycle complexity to data that
  can be regenerated completely before delivery.

## Consequences

Generation can perform expensive derivations once and ship indexed reads.
Independent validation is essential because no runtime writer maintains derived
values. Dataset changes require regeneration and redistribution. Versioned
imports can leave old database files on a device; this decision does not provide
automatic cleanup or eliminate the temporary disk cost of an upgrade.

## Evidence and related decisions

- [Schema descriptors](../../shared/railway-reference/schema.ts),
  [version constants](../../shared/railway-reference/database-version.ts) and
  [native provider](../../src/features/railway-reference/provider.tsx).
- [Generation](../../script/railway-database/database.ts),
  [staged setup](../../script/railway-database/setup.ts) and
  [promotion rollback](../../script/railway-database/staging.ts).
- Enables [stored totals](0003-precompute-section-totals-and-point-ordinals.md),
  [visibility metadata](0005-store-visibility-classes-with-a-narrow-index.md) and
  [recorded endpoints](0006-reference-recorded-section-endpoints.md).
