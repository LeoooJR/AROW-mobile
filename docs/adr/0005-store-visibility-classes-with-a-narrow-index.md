# ADR-0005: Store visibility classes with a narrow geographic index

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

The first viewport implementation evaluated numerical-PK modulo predicates at
runtime without the geographic display index. Fixed reference data lets us
compute eligibility once. We wanted a clear schema and substantial read gains
without immediately duplicating every returned field in a covering index.

## Decision

Store `kilometric_points.visibility_class` as a required integer from 0 to 3,
computed after deduplication: 0 for whole kilometres including zero; otherwise
1 for half kilometres; otherwise 2 for hectometres; otherwise 3. Use the explicit
purpose-based name rather than the exploratory `pk_class` name. Zoom thresholds
remain application policy, not railway-domain rules.

Create one secondary index after bulk insertion:

```sql
CREATE INDEX kilometric_points_display_idx
ON kilometric_points (visibility_class, longitude, latitude);
```

Because the table is `WITHOUT ROWID`, its composite primary key is included
implicitly. Do not explicitly duplicate that key, labels or ordinals. Run
`ANALYZE` during generation. Validate both recomputed classes and the complete
index column layout, including the implicit primary-key suffix.

Bind eligible classes through `IN` placeholders for ordinary and wrapped
viewport queries. Keep full-row retrieval and stable ordering, without candidate
subqueries or materialized CTEs. Retain native numerical filters to suppress
stale dense results immediately during zoom-out.

## Alternatives and evidence

The exploratory desktop comparison reported approximately 29.48 MiB for the narrow
index versus 33.34 MiB for a covering index also containing `label` and
`position_in_section`. On the dense zoom-10 viewport, median complete-result
lookup was 31.37 ms for the original unindexed query, 2.52 ms for the narrow
index and 0.81 ms for covering. These historical figures come from the
[database guide](../railway-database.md#point-visibility-classes-and-geographic-index);
they are not new measurements or Android guarantees.

The covering version was faster. We deliberately chose the smaller starting
footprint with strong measured performance. An expression index was considered,
but an explicit stored column makes the classification visible and SQL simpler.

## Consequences

Generation and validation gain responsibility; the application avoids repeated
classification in SQL. The index still requires primary-table reads for labels
and ordinals, and does not eliminate all filtering or ordering work. A B-tree
over these columns is not a general two-dimensional spatial index.

If Android profiling justifies more storage, replace this index with
`(visibility_class, longitude, latitude, label, position_in_section)`. Do not keep
both redundant indexes. Write amplification is paid during generation, while
the application has no reference-data writes.

## Related implementation and decisions

- [Classification](../../shared/railway-reference/milestone-visibility-class.ts),
  [index creation](../../script/railway-database/queries.ts) and
  [independent validation](../../script/railway-database/point-display-metadata.ts).
- Optimises [ADR-0004](0004-load-visible-points-from-sqlite.md) under the
  [asset lifecycle](0001-generate-and-version-the-reference-asset.md).
