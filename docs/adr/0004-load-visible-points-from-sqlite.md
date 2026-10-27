# ADR-0004: Load visible points from SQLite with progressive display

**Status:** Accepted

**Recorded:** 2026-10-27

## Context

Importing every supported numerical marker expanded the reference substantially.
Loading a national point GeoJSON into the map at startup became an unacceptable
memory and rendering workload, and displaying every point at low zoom obscured
the network. Reducing passive density must not change the meaning of search,
navigation, counters or section bounds.

## Decision

Use SQLite viewport queries for map points. Apply geographic bounds and the
eligible numerical-PK tier before rows reach JavaScript. Preserve antimeridian
queries, debouncing and stale-response protection. Convert only returned points
to GeoJSON through the runtime `Milestone.toGeoJSON()` representation; retain
the selected point across viewport updates. Keep an empty source mounted and
treat it as ready.

Stop generating and downloading a separate milestone GeoJSON asset. Railway-line
geometry remains GeoJSON. SQLite is the runtime source of recorded points.

| Zoom     | Passive points                    |
| -------- | --------------------------------- |
| Below 10 | None                              |
| 10–<12   | Numerical PK divisible by 1,000 m |
| 12–<14   | Numerical PK divisible by 500 m   |
| 14–<15   | Numerical PK divisible by 100 m   |
| 15+      | Every recorded point              |

Classification is independent of marker type and label padding. Native layer
bands suppress stale dense results during zoom-out; labels begin at zoom 13 and
remain collision-aware. Selected points bypass passive precision filtering from
zoom 10, but still respect layer visibility. Endpoints get no special passive
exception. Search and navigation use every recorded point, and navigation focuses
destinations at zoom 15.

## Alternatives

Loading all points through GeoJSON duplicates the point dataset and startup
workload. Filtering only in JavaScript still transfers unnecessary rows.
Clustering introduces aggregate features and an expansion interaction rather
than selecting individual recorded points. Restricting navigation to the visible
tier would make counters and adjacent-point actions zoom-dependent.

## Consequences

Startup and viewport work no longer require loading the national point collection.
Viewport density still depends on the area and tier; this decision does not
establish a hard point cap. Low zoom can show no passive points for some sections.
SQL and native filters must stay consistent while asynchronous requests change.

## Evidence and related decisions

- [Viewport hook](../../src/features/use-visible-milestones.ts),
  [viewport retrieval](../../src/features/railway-reference/visible-milestones.ts),
  [display policy](../../src/features/railway-reference/milestone-display.ts) and
  [native layers](../../src/components/adapters/map/milestone-layer.tsx).
- [Runtime display and navigation behavior](../map-interactivity.md).
- [ADR-0005](0005-store-visibility-classes-with-a-narrow-index.md) optimises the
  viewport predicate; [ADR-0007](0007-centralise-native-map-feature-picking.md)
  separates tap targets from visual density.
