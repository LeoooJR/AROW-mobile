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

Until AROW has a custom map style, use MapLibre's documented demo style at
`https://demotiles.maplibre.org/style.json`. Keep the initial camera, gestures,
ornaments, and rendering behavior at MapLibre's defaults unless a product
requirement explicitly changes them.

Do not add sources, layers, GeoJSON, markers, annotations, location tracking, or
map event handling without extending this context for that feature first.

## Platforms and runtime

The interactive map is native to Android and iOS and requires a development or
production build containing the MapLibre native module; it does not run in Expo
Go. The web implementation must remain a lightweight, accessible fallback and
must not import or initialize the native MapLibre package.

Keep stable accessibility labels and test IDs on both platform implementations.
