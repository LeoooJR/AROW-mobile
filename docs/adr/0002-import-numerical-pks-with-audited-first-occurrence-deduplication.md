# ADR-0002: Import numerical PKs with audited first-occurrence deduplication

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

Filtering the source CSV to `Kilomètre`, or only `Kilomètre` and `Hectomètre`,
excluded precise recorded points. Source inspection showed that geometry PKD/PKF
labels were not a reliable substitute for available records. Expanding the
accepted marker types also exposed multiple CSV rows for the same section and
numerical position, sometimes with different labels or coordinates.

## Decision

Accept every marker type when its PK contains digits before `+` and exactly
three digits after it and yields a non-negative safe integer metre position.
Preserve the retained source label, including leading zeroes.

> [!WARNING]
> **DUPLICATE FILTER APPLIED — FIRST CSV OCCURRENCE WINS.**
> Keep only the first physical CSV occurrence of
> `(code_ligne, rg_troncon, position_m)`, regardless of marker type, label padding
> or coordinates. This is a source-order rule, not a quality assessment.

Check supported numerical position and section identity before deduplication;
validate coordinates for retained rows. Sort only after retaining the first
occurrence. Unsupported PKs are audited separately from duplicates; malformed
headers, column counts, identities on supported rows and retained coordinates
remain generation errors.

Keep source hashes, unsupported-row reasons and retained/discarded duplicate
evidence in the generated import report. Publish it with the other staged
outputs and print an explicit warning, using bold red when supported and
respecting `NO_COLOR`. The report is outside version control and runtime imports.

## Alternatives

Marker-type filtering loses precision. A type priority, coordinate averaging or
geographic quality ranking would introduce rules not established by the source
analysis. Keeping all duplicates conflicts with exact section/position identity.

## Consequences

Search and navigation gain precise recorded points, but the dataset grows and
requires viewport-based map loading. Reordering a future CSV can change retained
coordinates. The detailed audit makes the discarded evidence inspectable; it
does not prove that the chosen coordinates are more accurate. Changing this
policy requires regeneration and review of the audit.

## Evidence and related decisions

- [CSV importer](../../script/railway-database/csv.ts),
  [import report](../../script/railway-database/import-report.ts) and
  [import tests](../../script/railway-database/csv.node.test.ts).
- The [documented pinned snapshot](../railway-database.md#import-policy-and-audit-trail)
  has 371,734 retained points, 181 unsupported rows and 908 discarded duplicates.
- Derived metadata in [ADR-0003](0003-precompute-section-totals-and-point-ordinals.md)
  uses only retained points; [ADR-0004](0004-load-visible-points-from-sqlite.md)
  addresses the expanded map dataset.
