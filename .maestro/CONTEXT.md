# Maestro test context

These instructions apply to the Maestro configuration and flows under
`.maestro/`.

## Journey maintenance

- Model tests as durable, goal-driven user journeys. Evolve an existing flow as
  its product workflow grows instead of documenting or naming it after one
  temporary implementation stage.
- Treat `.maestro/config.yaml` as the source of truth for the configured suite
  and execution order.
- Run every configured flow before reporting Maestro validation as passing.
- Keep device selection explicit when more than one Android target may be
  connected. Automated local runs must target an `emulator-*` serial and must
  not select a physical device.

## Recording

Record only the flows that exercise the feature being delivered. The complete
suite must pass before recording.

Use Maestro's local recorder first. The output name is intentionally generic so
it remains valid as the journey evolves:

```bash
maestro --device emulator-5554 record --local .maestro/tests/mock-phone-location.yaml /private/tmp/arow-e2e-recording.mp4
```

Present the video only when the recorded flow passes. If Maestro's local
recorder fails or cannot render a usable video, use ADB as the fallback. Start
the emulator recording, run the same Maestro flow in another terminal, and stop
the recording with `Ctrl+C` only after the flow passes:

```bash
adb -s emulator-5554 shell screenrecord --bit-rate 2000000 /sdcard/arow-e2e-recording.mp4
```

```bash
maestro --device emulator-5554 test .maestro/tests/mock-phone-location.yaml
```

Then copy the fallback recording to the host for review:

```bash
adb -s emulator-5554 pull /sdcard/arow-e2e-recording.mp4 /private/tmp/arow-e2e-recording.mp4
```

Do not use ADB recording before trying Maestro's local recorder. Do not present
a recording from a failed flow.
