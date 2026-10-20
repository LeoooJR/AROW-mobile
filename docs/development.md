# Develop AROW Mobile

This guide covers local setup, development builds, previews, and code-quality
checks. Run all commands from the repository root. For an introduction to the
application, see the [README](../README.md).

## Get started

You need **Node.js 24 or newer**, npm, and an Android development environment with
the Android SDK, Java, the `android` CLI, and an emulator.

Install dependencies and prepare the railway reference:

```bash
npm ci
npm run database:setup
```

Dataset setup downloads the pinned railway geometry and milestone data, verifies
the source files, and generates the GeoJSON and SQLite assets used by the app.
Generated assets stay outside version control. If startup reports missing or
invalid assets, rerun `npm run database:setup`. Prepare these assets before an EAS
build too: the upload includes them and the remote build validates them.

Start and boot your Android emulator, then build and open the development client:

```bash
./script/build_dev_client.sh --device medium_phone
```

Replace `medium_phone` with your emulator's AVD name, rather than its ADB serial.
AROW uses native map and mock-location modules, so it requires a custom native
build. The helper installs the debug APK, starts or reuses Metro, and opens the
client. The APK is generated at
`android/app/build/outputs/apk/debug/app-debug.apk`.

To use location simulation, grant precise location access, enable Android
location services, and select **AROW-mobile** as the mock location app in Android
Developer options. The app checks these requirements before starting a
simulation.

## Everyday development

With the development build installed, start the development server:

```bash
./script/start_dev_client.sh --dev-client
```

Press **a** in the terminal to open the Android app. Rebuild after changing native
modules or Expo configuration. The old `script/build_and_run.sh` entry point
forwards to the development-build helper for existing Run actions.

## Local Android preview

A local release preview embeds the JavaScript and railway assets and opens
without Metro or the Expo development launcher. No EAS account or build service
is needed.

With the prerequisites and railway assets prepared and your emulator booted, run:

```bash
./script/build_and_run_preview.sh --device medium_phone
```

Use this preview to inspect the native splash and its handoff to the in-app
loading artwork. Loading continues until the local railway sources and initial
map viewport are rendered. A startup error or 30-second timeout opens the retry
screen. After restoring connectivity, choose **Réessayer** to reload without
clearing application data.

Both build helpers require an explicit AVD name and a connected, booted emulator.
Physical devices are not supported by these helpers. Missing names and ambiguous
matches are rejected; no default device is selected.

Each invocation refreshes the generated Android configuration and runs an
incremental build for the selected emulator's CPU architecture. Gradle caches
are retained. Missing prerequisites are reported without automatically installing
tools, dependencies, or railway assets. The first build may download the Expo
native template and Gradle dependencies.

On machines with limited RAM, reduce Gradle's parallel workers:

```bash
GRADLE_OPTS=-Dorg.gradle.workers.max=1 ./script/build_and_run_preview.sh --device medium_phone
```

The preview APK is generated at
`android/app/build/outputs/apk/release/app-release.apk`. It uses local development
signing for testing and is not a store submission artifact. Preview and
development builds share an app ID and replace each other while preserving
application data. A signing conflict stops installation; the helper never
uninstalls or clears the app.

To inspect the splash again, force-stop the preview and launch it from the
emulator's app launcher. Metro can remain stopped. To return to development,
reinstall the development build:

```bash
./script/build_dev_client.sh --device medium_phone
```

Starting Metro alone does not turn an installed preview into a development client.

## Code quality and testing

```bash
npm run check
npm run test:ci
```

`check` runs architecture rules, source/configuration formatting, lint, the
application type check, and an independent Node-only shared type check.
`test:ci` runs code tests without production datasets or the asset-dependent
`pretest` hook. It excludes the production GeoJSON snapshot and bundled SQLite
schema suites. Fixture-based tooling and in-memory repository tests remain
included. Ordinary `npm test` retains the full local suite and asset precheck.

GitHub Actions runs these commands for pull requests and pushes to `main`.
Production dataset preparation/validation and Android/web exports are outside
this CI pass. Formatting excludes Markdown, prototypes, generated assets, and
vendored material; check changed documentation explicitly:

```bash
npx prettier --check --ignore-path /dev/null README.md docs/development.md
```

See [Android testing](../.maestro/README.md) for emulator setup and Maestro
journeys. For deeper context, see the [simulation lifecycle](../src/features/simulation/README.md),
[Android icon artwork](../assets/images/ANDROID-ICON.md), and
[desktop/mobile communication contract](HOW_TO_communication_contract).
