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
the Android SDK, Java, the `android` CLI, and an emulator or connected device.

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

Start your Android emulator, then build and open the development client:

```bash
./script/build_dev_client.sh --device medium_phone
```

AROW uses native map and mock-location modules, so it needs a custom native build.
The helper installs the debug APK, starts or reuses Metro, and opens the client.
Its APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.
For subsequent sessions with that build installed, start the development server:

```bash
./script/start_dev_client.sh --dev-client
```

Press **a** in the terminal to open the Android app. Rebuild after changing native
modules or Expo configuration.

The old `script/build_and_run.sh` entry point forwards to this helper so existing
Codex Run actions and approval rules continue to work.

To use location simulation, grant precise location access, enable Android
location services, and select **AROW-mobile** as the mock location app in Android
Developer options. The app checks these requirements before starting a
simulation.

### Local Android preview

To check the native splash screen, build a local release preview. It embeds the
JavaScript and railway assets and opens directly without Metro or the Expo
development launcher. No EAS account or build service is needed.

The splash stays visible until the local railway sources and initial map viewport
are rendered. A startup error or 30-second timeout opens a retry screen. After
restoring connectivity, choose **Réessayer** to reload the map without clearing
application data. Validate splash appearance in this release preview rather than
the development client.
On Android, the native splash hands off to matching in-app artwork while MapLibre
renders; the loading screen remains until the map is ready.

Use Node.js 24 or newer, the installed JDK, the Android SDK and `android` CLI,
and the dependencies and railway assets prepared above. Start an Android emulator,
then run:

```bash
./script/build_and_run_preview.sh --device medium_phone
```

Both build helpers require an explicit AVD name, such as `medium_phone`, rather
than an ADB serial. The named emulator must already be connected and booted.
Missing names and ambiguous matches are rejected; no default device is selected.

Physical devices are not supported by these helpers. Each invocation refreshes the
generated Android configuration and runs an incremental build, so changes
to JavaScript, native modules, and splash configuration are included. Gradle
caches are retained. The APK targets the selected emulator's CPU architecture.
Missing prerequisites are reported without installing tools,
dependencies, or railway assets automatically. The first build may download the
Expo native template and Gradle dependencies.

On machines with limited RAM, reduce Gradle's parallel workers for a build:

```bash
GRADLE_OPTS=-Dorg.gradle.workers.max=1 ./script/build_and_run_preview.sh --device medium_phone
```

The APK is generated at
`android/app/build/outputs/apk/release/app-release.apk`. It uses local development
signing for testing; it is not a store submission artifact. Preview and development
builds use the same app ID and replace each other while preserving application
data. A signing conflict stops installation; the helper never uninstalls or clears
the app.

To inspect the splash again, force-stop the preview and launch it from the emulator's
app launcher. Metro can remain stopped. To switch back to development, reinstall
the development build on the same emulator:

```bash
./script/build_dev_client.sh --device medium_phone
```

Replace `medium_phone` with your emulator's AVD name. Starting Metro alone
does not turn an installed release preview into a development client.

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
