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

The map accepts optional immutable `Milestone` domain instances from its owning
screen and assembles their `toGeoJSON()` features inside this adapter boundary. It keeps
an empty milestone source mounted while data is unavailable so its dot layer can
act as the stable ordering anchor. It renders no points in that state and does
not query SQLite or interpret loading and failure states. Milestone dots appear
from zoom 10 and collision-aware labels from zoom 13.

For the expanded reference, the owning screen requests only the visible
viewport's points from the railway-reference feature, debounced after camera
changes and only from zoom 10 while points are visible. It does not load the
whole-country point GeoJSON at startup. The adapter reports bounds and zoom via
`onViewportChange`, converts the supplied immutable points to GeoJSON, and keeps
the source mounted across updates. Selected points remain represented during
viewport transitions. All points stay available in SQLite for search and
navigation; this is a rendering/loading policy, not a dataset filter. An empty
point array is a ready source and does not delay basemap startup.

`src/features/railway-reference/milestone-display.ts` owns the numerical PK display bands shared by
the viewport query and native layers: whole kilometres at zoom 10, 500-metre
positions at 12, 100-metre positions at 14, and every recorded PK at 15. Native
layers use mutually exclusive zoom ranges so stale finer data is hidden during
zoom-out before the debounced SQLite response. The first dot layer remains the
stable railway ordering anchor. Labels start at 13 and follow the active band.
Only the selected milestone bypasses the PK filter, from zoom 10; it still
respects layer visibility. Section endpoints have no display exception.
Navigation and counters use all recorded points regardless of display density;
navigation and endpoint focus retain zoom 15. No domain or source GeoJSON fields
encode this presentation policy.

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

The map accepts an optional, explicitly typed current-location input from its
owning screen. On the first available fix it centers at the approved local zoom,
then leaves the camera under user control while later fixes move the marker. If
the input becomes unavailable, it removes the marker and restores the global
world view; a later fix starts a new focus cycle. Both real and controlled mocked
fixes use this presentation behavior.

While the location subscription is transiently reconnecting, the owning screen
keeps the last valid fix supplied to the map. This retained fix preserves both
the marker and the user-controlled viewport and does not start a new camera
acquisition cycle. Initial acquisition without a fix and explicit unavailable or
error states still remove the input and restore the world view.

`map-camera.tsx` owns the native camera constants, acquisition and loss
lifecycle, explicit recenter requests, and reduced-motion transitions.
`user-location-marker.tsx` owns the marker annotation, theme, artwork, heading,
and map-bearing compensation. `map.tsx` coordinates the map container and
forwards camera-bearing changes to the marker.

The owning screen may send an explicit recenter request when the user invokes a
real-position control. Each new request moves the camera to the latest supplied
location at the approved local zoom, north-up, and zero pitch. Ordinary location
updates must not issue these requests or resume automatic following. Product
state decides whether an action is eligible to become a camera request; the map
adapter only executes requests it receives while a location is available.

The current-location marker follows the light and dark home prototypes: a brand
orange halo and core, a theme-foreground outline, and a directional arrow. Its
arrow uses the supplied travel heading, remains correct relative to map bearing,
and falls back to north when heading is unavailable. Camera transitions respect
the operating system's reduced-motion preference.

The bundled AROW railway reference is supplied by the owning screen as a local
GeoJSON URI. The adapter renders it from regional zoom onward as a restrained
interactive line layer and translates validated source properties to a
`Railway` aggregate and its selectable `RailwaySection` child when a feature is
pressed. Milestone presses produce `Milestone` instances, and their shared
railway-section key drives parent-line highlighting. The generic map-feature
abstraction itself carries no railway or geometry fields. The owning screen
remains responsible for the single selected feature and passes it back for
orange highlighting. A selected milestone highlights both its point and parent
railway section. The adapter does not load files, query persistence, or own
selection state.

All railway layers are explicitly inserted below the milestone-dot anchor.
Milestone dots, selected points, and labels retain visual priority regardless of
source loading order. Tap priority is controlled independently by the map picker.

## Feature hit testing

`map-hit-policy.ts` owns the marker circle dimensions and extra tap tolerance.
Normal circles occupy a 5 dp radius including their stroke. Extra tolerance is
2 dp at zoom 10–<12, 6 dp at 12–<14, 3 dp at 14–<15 and 1 dp at 15+; below 10,
markers cannot be selected. The selected circle uses its own visible radius and
stroke with the same extra tolerance. These are initial fixed policy values.

Both GeoJSON sources are presentation-only. `Map` handles presses centrally;
`map-feature-picker.ts` queries rendered features only in the active dot layer
and mounted selected-circle layer, projects nearby candidates, and chooses the
nearest eligible centre inside its circular target. Duplicate IDs are projected
once. Exact distance ties use serialized milestone ID order. Labels remain
collision-aware and visible but never participate in hit testing.

If no dot qualifies, the picker queries the visible railway layers within the
existing 44×44 dp window and chooses the first valid railway in rendered order.
Thus a dot hit wins, while nearby line taps can select the line without hiding
markers. Use MapLibre screen coordinates directly; Android's native bridge
already handles display density. Feature validation stays in the adapter's
`map-feature-parsing.ts` helpers, independent of source rendering and SQLite.

`use-map-feature-press.ts` cancels stale results after newer taps, camera movement,
selection/source/visibility changes, style reloads and unmount. Query failures and
empty map taps leave the selection unchanged. No public map callback, marker
display tier, navigation behaviour or reference asset changes with this policy.

The owning screen controls visibility for exactly the railway and milestone
feature families. Both are visible by default. Visibility applies to passive,
selected, and label layers and excludes hidden families from central hit testing, but
sources and the milestone-dot ordering anchor remain mounted. The base-map style
is permanent and is not part of this visibility contract.

Do not add other GeoJSON, markers, annotations, location tracking, or map event
handling without extending this context for that feature first.

## Platforms and runtime

The interactive map is native to Android and iOS and requires a development or
production build containing the MapLibre native module; it does not run in Expo
Go. The web implementation must remain a lightweight, accessible fallback and
must not import or initialize the native MapLibre package.

Keep stable accessibility labels and test IDs on both platform implementations.
