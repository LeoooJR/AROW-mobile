# Run the Android Maestro flows

Run these commands from the repository root. The flows use an Android development
client connected to Metro on port **8081**; Expo Go cannot run the app's native
mock-location module.

## One-time setup

You need Node.js 24 or newer, the Android SDK and `android` CLI, ADB, Maestro,
and an Android virtual device (AVD). Install the project dependencies and
prepare the bundled railway reference if you have not done so already:

```bash
npm install
npm run database:setup
```

Start an AVD from Android Studio's Device Manager or with the CLI. For example:

```bash
android emulator start medium_phone
adb devices -l
```

Confirm that the listed serial starts with `emulator-`. Use that exact serial
for Maestro; `emulator-5554` below is only an example. Install the development
client on the AVD the first time, and rebuild it after native-module or Expo
configuration changes:

```bash
npx expo run:android --device medium_phone
```

Replace `medium_phone` with your AVD's name. This build command may also start
Metro. If it does, use that server for the first flow or stop it with `Ctrl+C`
before starting the helper below. See the project
[setup instructions](../README.md#get-started) if the railway assets are missing.

## Run a flow

In one terminal, start Metro and leave it running:

```bash
./script/build_and_run.sh --dev-client
```

The helper resolves the Android SDK and starts Expo for the installed
development client. Its `--android` mode also opens the app when you want to
use it interactively. The Maestro flows open the app themselves, so
`--dev-client` is enough for tests.

In another terminal, select the confirmed emulator and run the flow you need:

```bash
export AROW_EMULATOR_SERIAL=emulator-5554
maestro --device "$AROW_EMULATOR_SERIAL" test .maestro/tests/manage-location-permission.yaml
```

| Flow                                                                             | What it exercises                                                                                                  |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`manage-location-permission.yaml`](tests/manage-location-permission.yaml)       | Denied location access, recovery through the Android prompt or Settings, and permission persistence after restart. |
| [`mock-phone-location.yaml`](tests/mock-phone-location.yaml)                     | Real location, milestone search, and the mock-app readiness failure.                                               |
| [`manage-map-feature-selection.yaml`](tests/manage-map-feature-selection.yaml)   | Selecting railway and milestone features on the map.                                                               |
| [`manage-map-layers.yaml`](tests/manage-map-layers.yaml)                         | Map layer visibility.                                                                                              |
| [`manage-map-focus.yaml`](tests/manage-map-focus.yaml)                           | Map-only mode.                                                                                                     |
| [`select-mock-location-provider.yaml`](tests/select-mock-location-provider.yaml) | Selecting AROW in Android Developer options as the mock location app.                                              |

Choose flows that exercise the change you are checking. To run the complete
configured suite in [execution order](config.yaml), use:

```bash
maestro --device "$AROW_EMULATOR_SERIAL" test .maestro
```