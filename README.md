<p align="center">
  <img src="assets/images/android-icon.png" width="112" height="112" alt="AROW Mobile icon" />
</p>

# AROW Mobile

Welcome to AROW Mobile! Explore railway lines, find milestones, and simulate
your phone's location for railway research and development.

AROW stands for **Advanced Railway geOlocation Workflow**. This Android app brings
railway reference data and on-device location simulation into one map-based
workspace, built with React Native, Expo, and MapLibre.

## What you can do

- **Explore the railway map.** Inspect railway sections and milestones, choose
  which layers to display, and switch to a map-only view.
- **Find a railway point.** Search by line code or name, choose a section, and
  locate a kilometre point such as **PK 509+000**.
- **Simulate a location.** Use a searched milestone as the phone's reported GPS
  position for controlled railway scenarios.

AROW Mobile is the companion to AROW Desktop. Communication between the two apps
is planned; the [communication contract](docs/HOW_TO_communication_contract)
describes that future integration.

## Get started

You need **Node.js 24 or newer**, npm, and an Android development environment with
the Android SDK, Java, and an emulator or connected device.

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare the railway reference

```bash
npm run database:setup
```

This downloads the pinned railway geometry, milestones, and kilometre-point data
from the project's public reference-data folder.
It verifies the source files and generates the GeoJSON and SQLite assets used by
the app. These generated assets stay outside version control.

If startup reports missing or invalid railway assets, rerun this command. Startup
checks the assets but does not download or repair them. Prepare them locally
before an EAS build too; the upload includes them and the remote build validates
them.

### 3. Open the Android app

Start your Android emulator or connect your development device, then build and
open the app:

```bash
npx expo run:android
```

AROW uses native map and mock-location modules, so it needs a development build.
For subsequent sessions with that build installed, start the development server:

```bash
npm start -- --dev-client
```

Press **a** in the terminal to open the Android app. Rebuild after changing native
modules or Expo configuration.

To use location simulation, grant precise location access, enable Android
location services, and select **AROW-mobile** as the mock location app in Android
Developer options. The app checks these requirements before starting a
simulation.

## Explore the project

- [Map interactions](docs/map-interactivity.md) - how railway selection and
  metadata cards work.
- [Search to simulation](docs/search-to-simulation.md) - the journey from a
  railway search to an applied GPS position.
- [Simulation lifecycle](src/features/simulation/README.md) - how simulation state
  is managed.
- [Design guide](DESIGN.md) - AROW's visual identity and interface conventions.
- [Android icon artwork](assets/images/ANDROID-ICON.md) - editable sources and
  asset regeneration.
- [Local Android testing](.maestro/README.md) - setup and Maestro journeys.

If you're new to the codebase, start with the map-interaction and
search-to-simulation guides: they connect the user experience to the code behind
it.
