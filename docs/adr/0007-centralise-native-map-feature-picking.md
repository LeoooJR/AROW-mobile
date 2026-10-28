# ADR-0007: Centralise native map feature picking

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

Native source-level hit testing selected the highest source before JavaScript
received the event. Marker labels and large source hitboxes intercepted intended
railway taps. Shrinking a source hitbox alone could not provide a reliable
nearest-dot decision followed by railway fallback across different densities.

## Decision

Let `Map` own presses and native feature queries. Keep GeoJSON sources focused on
rendering, and isolate feature parsing and picking from rendering components and
SQLite access. Preserve the existing `onFeaturePress(MapFeature)` interface and
screen-owned selection state.

Read current native zoom for each tap and query only active visible circle
layers, including the mounted selected circle. Exclude label layers. Validate
and deduplicate candidates, project their centres and select the nearest inside
its circular target, breaking exact ties by serialized milestone ID. Query
visible railways in rendered order only if no marker qualifies.

Share visible radius and stroke constants with hit testing, adding the agreed
zoom-dependent tolerance. Apply that same tolerance to the larger selected
circle. Use native density-independent coordinates without an extra PixelRatio
conversion. Keep the railway's 44×44 dp query window. Current numeric values are
documented in the [interaction guide](../map-interactivity.md#marker-targets-and-railway-fallback).

Invalidate pending work after newer taps, camera, selection, source or visibility
changes, style reloads and unmount. Empty hits, failed queries and stale responses
must not unexpectedly replace selection or cause unhandled rejections.

## Alternatives

Source handlers cannot reliably coordinate cross-source fallback after native
source priority has already been applied. Selecting the first marker ignores
distance. Querying labels preserves accidental interception. Projecting every
loaded point adds unnecessary work compared with nearby rendered candidates.

## Consequences

Taps can distinguish dots from adjacent lines without hiding markers, and label
visibility no longer enlarges tap targets. The adapter now owns more asynchronous
coordination and must test native failures, projection, layer availability and
cancellation. Target tuning still needs device evidence; this decision does not
claim exhaustive Android validation or freeze the initial numerical tolerances.

## Evidence and related decisions

- [Picker](../../src/components/adapters/map/feature-picker.ts),
  [hit policy](../../src/components/adapters/map/hit-policy.ts),
  [cancellation hook](../../src/components/adapters/map/use-feature-press.ts) and
  [picker tests](../../src/components/adapters/map/feature-picker.test.ts).
- Complements [progressive display](0004-load-visible-points-from-sqlite.md);
  it does not change navigation or database records.
