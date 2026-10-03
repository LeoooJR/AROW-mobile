import {
  decodeNotificationVisibility,
  decodeReadiness,
  decodeSnapshot,
  decodeStartResult,
  decodeStopResult,
  NativeContractError,
} from "./decode-native-result";
import {
  NATIVE_ERROR_CODES,
  NATIVE_READINESS_ERROR_CODES,
  type NativeRunningSnapshot,
  type NativeStopResult,
} from "./native-contracts";

test.each([true, false])(
  "accepts boolean notification visibility %s",
  (visible) => {
    expect(decodeNotificationVisibility(visible)).toBe(visible);
  },
);
test.each([undefined, null, 0, "false", [], {}])(
  "rejects malformed notification visibility %j",
  (value) => {
    expect(() => decodeNotificationVisibility(value)).toThrow(
      NativeContractError,
    );
  },
);

test("accepts readiness and harmless additional fields", () => {
  expect(decodeReadiness({ ready: true, extra: 1 })).toEqual({ ready: true });
});
test.each(NATIVE_READINESS_ERROR_CODES)(
  "decodes readiness failure %s",
  (code) => {
    expect(decodeReadiness({ ready: false, code })).toEqual({
      ready: false,
      code,
    });
  },
);
test.each([
  null,
  [],
  true,
  {},
  { ready: "true" },
  { ready: false },
  { ready: false, code: "APPLY_FAILED" },
])("rejects malformed readiness %j", (value) => {
  expect(() => decodeReadiness(value)).toThrow(NativeContractError);
});
test("decodes stopped without treating stale fields as an applied position", () => {
  expect(decodeSnapshot({ status: "stopped", latitude: 1 })).toEqual({
    status: "stopped",
  });
});
test.each(["starting", "running"] as const)(
  "decodes %s coordinates including zero",
  (status) => {
    expect(decodeSnapshot({ status, latitude: 0, longitude: 0 })).toEqual({
      status,
      latitude: 0,
      longitude: 0,
    });
    expect(decodeSnapshot({ status, latitude: -90, longitude: 180 })).toEqual({
      status,
      latitude: -90,
      longitude: 180,
    });
  },
);
test.each([undefined, null, "1", NaN, Infinity, -Infinity, 91, -91])(
  "rejects invalid latitude %s",
  (latitude) => {
    for (const status of ["running", "starting"]) {
      expect(() => decodeSnapshot({ status, latitude, longitude: 0 })).toThrow(
        NativeContractError,
      );
    }
  },
);
test.each([undefined, null, "1", NaN, Infinity, -Infinity, 181, -181])(
  "rejects invalid longitude %s",
  (longitude) => {
    expect(() =>
      decodeSnapshot({ status: "running", latitude: 0, longitude }),
    ).toThrow(NativeContractError);
  },
);
test.each(NATIVE_ERROR_CODES)(
  "decodes error %s with explicit provider ownership",
  (code) => {
    for (const ownsProviders of [true, false]) {
      expect(
        decodeSnapshot({
          status: "error",
          code,
          ownsProviders,
          latitude: 1,
          longitude: 2,
        }),
      ).toEqual({ status: "error", code, ownsProviders });
    }
  },
);
test.each([
  null,
  [],
  {},
  { status: "unknown" },
  { status: "error", ownsProviders: true },
  { status: "error", code: "UNKNOWN", ownsProviders: false },
  { status: "error", code: "CLEANUP_FAILED" },
  { status: "error", code: "CLEANUP_FAILED", ownsProviders: "true" },
])("rejects malformed snapshot %j", (value) => {
  expect(() => decodeSnapshot(value)).toThrow(NativeContractError);
});
test("rejects incomplete running results at compile time and at the bridge", () => {
  // @ts-expect-error Running results must include both applied coordinates.
  const incomplete: NativeRunningSnapshot = { status: "running", latitude: 0 };
  expect(() => decodeSnapshot(incomplete)).toThrow(NativeContractError);
});
test("restricts completed start and stop results", () => {
  const running = { status: "running", latitude: 0, longitude: 0 } as const;
  const stopped = { status: "stopped" } as const;
  const error = {
    status: "error",
    code: "CLEANUP_FAILED",
    ownsProviders: true,
  } as const;
  expect(decodeStartResult(running)).toEqual(running);
  expect(decodeStartResult(stopped)).toEqual(stopped);
  expect(decodeStartResult(error)).toEqual(error);
  expect(decodeStopResult(stopped)).toEqual(stopped);
  expect(decodeStopResult(error)).toEqual(error);
  expect(() => decodeStartResult({ ...running, status: "starting" })).toThrow(
    NativeContractError,
  );
  expect(() => decodeStopResult({ ...running, status: "starting" })).toThrow(
    NativeContractError,
  );
  // @ts-expect-error Stop results cannot acknowledge a running simulation.
  const invalidStop: NativeStopResult = running;
  expect(() => decodeStopResult(invalidStop)).toThrow(NativeContractError);
});
