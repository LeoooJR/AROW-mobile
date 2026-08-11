# Map Adapter Context

Read this file before creating or modifying files in this directory.

## Responsibility

This directory is the application-owned boundary around MapLibre React Native.
Application routes and components must import the map from this directory rather
than importing `@maplibre/maplibre-react-native` directly.

The adapter renders presentation only. It must not fetch railway data, read
files, request device location, persist state, select routes, or own simulation
workflows. Add future map inputs and callbacks through narrow, explicitly typed
props when a product requirement needs them.

## Layout

The map fills the complete bounds supplied by its parent. Screen routes own the
viewport container, safe-area policy, navigation chrome, and any overlays placed
above the map.

## Base map

`map-style-light.ts` and `map-style-dark.ts` are the authorities for the light
and dark base-map designs. They follow their respective design prototypes, with
main railway infrastructure as the strongest passive feature. Brand orange
remains reserved for active routes, selections, markers, and simulation state.

The native adapter selects between these styles from the system color scheme
and responds to appearance changes while the application is running. Light is
the fallback when the system does not report a color scheme.

The styles use the public OpenFreeMap OpenMapTiles source and glyph service. They
must remain free to use, keyless, and correctly attributed. The public instance
has no availability guarantee; keep the source isolated in the style factory so
the same OpenMapTiles schema can move to self-hosted infrastructure later.

Keep the initial camera, gestures, ornaments, and rendering behavior at
MapLibre's defaults unless a product requirement explicitly changes them. Keep
generic POIs, business icons, stations, aerodromes, housenumbers, and sprites out
of the base style so future AROW railway data remains authoritative.

Do not add GeoJSON, markers, annotations, location tracking, or map event
handling without extending this context for that feature first.

## Platforms and runtime

The interactive map is native to Android and iOS and requires a development or
production build containing the MapLibre native module; it does not run in Expo
Go. The web implementation must remain a lightweight, accessible fallback and
must not import or initialize the native MapLibre package.

Keep stable accessibility labels and test IDs on both platform implementations.
