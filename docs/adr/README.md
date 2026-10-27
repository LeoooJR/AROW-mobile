# Architecture Decision Records

These records capture the context, choices and trade-offs behind AROW Mobile's
railway-reference optimisations and related architectural changes.

The initial records were written retrospectively from decisions accepted in the
development discussion and checked against the implementation. **Recorded** is
the documentation date, not a reconstructed approval or deployment date. Their
numbers group related decisions; they do not establish release chronology.

## Index

| ADR                                                                              | Decision                                                         | Status   | Recorded   |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------- | ---------- |
| [0001](0001-generate-and-version-the-reference-asset.md)                         | Generate and version an immutable reference asset                | Accepted | 2026-10-27 |
| [0002](0002-import-numerical-pks-with-audited-first-occurrence-deduplication.md) | Import numerical PKs with audited first-occurrence deduplication | Accepted | 2026-10-27 |
| [0003](0003-precompute-section-totals-and-point-ordinals.md)                     | Precompute section totals and point ordinals                     | Accepted | 2026-10-27 |
| [0004](0004-load-visible-points-from-sqlite.md)                                  | Load visible points from SQLite with progressive display         | Accepted | 2026-10-27 |
| [0005](0005-store-visibility-classes-with-a-narrow-index.md)                     | Store visibility classes with a narrow geographic index          | Accepted | 2026-10-27 |
| [0006](0006-reference-recorded-section-endpoints.md)                             | Reference recorded section endpoints with deferred foreign keys  | Accepted | 2026-10-27 |
| [0007](0007-centralise-native-map-feature-picking.md)                            | Centralise native map feature picking                            | Accepted | 2026-10-27 |
| [0008](0008-consolidate-railway-reference-feature-ownership.md)                  | Consolidate railway-reference ownership and feature entry hooks  | Accepted | 2026-10-27 |

## Reading the records

ADRs explain **why** a choice was made. Use the [database guide](../railway-database.md),
[map interaction guide](../map-interactivity.md) and
[search walkthrough](../search-to-simulation.md) for current implementation details.
Local `CONTEXT.md` files remain working rules, not decision histories.

Benchmark figures quoted here are historical desktop observations already
documented in the database guide. They were not rerun when writing these ADRs,
are not Android latency guarantees and do not constitute reproducible benchmark
artifacts. Preserve the workload and environment details when comparing future
measurements.

## Adding or replacing a decision

1. Copy [template.md](template.md) to the next unused `NNNN-descriptive-title.md`.
2. Record the problem, decision, meaningful alternatives, benefits and costs.
3. Link related records and concrete implementation or measurement evidence.
4. Use `Proposed` until a decision is accepted; retrospective records may use
   `Accepted` when the earlier decision and implementation are established.
5. Keep accepted rationale stable. Record replacement choices in a new ADR,
   update supersession links and status, and update this index.

Use `Deprecated` for a decision no longer applicable, `Superseded` for one
replaced by a linked ADR, and `Rejected` for a proposal explicitly not adopted.
Do not imply that an unselected alternative is implemented or that a review,
experiment or approval happened without evidence. Routine renames and formatting
changes do not need their own ADR.
