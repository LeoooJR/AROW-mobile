import { act, renderHook } from "@testing-library/react-native";

import type { AppStartupActions } from "@/features/app-startup/context";
import { createBasemapStartupAttempt } from "@/features/map-screen/check-basemap-source";
import { useMapStartup } from "./use-map-startup";

jest.mock("@/features/map-screen/check-basemap-source", () => ({
  createBasemapStartupAttempt: jest.fn(),
}));
const createAttempt = jest.mocked(createBasemapStartupAttempt);
const startup = (): AppStartupActions => ({
  status: "loading",
  onFailure: jest.fn(),
  onReady: jest.fn(),
});
const nativeTest = process.env.EXPO_OS === "web" ? test.skip : test;

beforeEach(() => {
  createAttempt.mockReset();
  createAttempt.mockImplementation(() => ({
    check: jest.fn(async () => {}),
    onRendered: jest.fn(),
  }));
});

test.each([null, "error", "ready"] as const)(
  "inactive startup (%s) initiates no check or render callback",
  async (status) => {
    const view = await renderHook(() =>
      useMapStartup(status === null ? null : { ...startup(), status }),
    );
    expect(view.result.current).toBeUndefined();
    for (const attempt of createAttempt.mock.results) {
      expect(attempt.value.check).not.toHaveBeenCalled();
    }
  },
);

test("loading only starts a check on native platforms", async () => {
  await renderHook(() => useMapStartup(startup()));
  const attempt = createAttempt.mock.results[0].value;
  expect(attempt.check).toHaveBeenCalledTimes(
    process.env.EXPO_OS === "web" ? 0 : 1,
  );
});

nativeTest(
  "delegates stable render events and startup callbacks to the attempt",
  async () => {
    const model = startup();
    const view = await renderHook(() => useMapStartup(model));
    const attempt = createAttempt.mock.results[0].value;
    expect(createAttempt).toHaveBeenCalledWith({
      onReady: model.onReady,
      onFailure: model.onFailure,
    });
    await act(async () => view.result.current?.());
    expect(attempt.onRendered).toHaveBeenCalledTimes(1);
    await view.rerender(undefined);
    expect(view.result.current).toBe(attempt.onRendered);
    expect(createAttempt).toHaveBeenCalledTimes(1);
    expect(attempt.check).toHaveBeenCalledTimes(1);
  },
);

nativeTest("unmount cancels the attempt's request", async () => {
  const model = startup();
  const view = await renderHook(() => useMapStartup(model));
  const attempt = createAttempt.mock.results[0].value;
  const signal: AbortSignal = attempt.check.mock.calls[0][0];
  expect(signal.aborted).toBe(false);
  await view.unmount();
  expect(signal.aborted).toBe(true);
});

nativeTest.each(["error", "ready"] as const)(
  "startup %s cancels its outstanding request",
  async (status) => {
    const model = startup();
    const view = await renderHook(
      (props: AppStartupActions) => useMapStartup(props),
      { initialProps: model },
    );
    const attempt = createAttempt.mock.results[0].value;
    const signal: AbortSignal = attempt.check.mock.calls[0][0];
    await view.rerender({ ...model, status });
    expect(signal.aborted).toBe(true);
    expect(view.result.current).toBeUndefined();
  },
);

nativeTest("retry remounts with a fresh attempt and signal", async () => {
  const model = startup();
  const first = await renderHook(() => useMapStartup(model));
  const old = createAttempt.mock.results[0].value;
  const oldSignal: AbortSignal = old.check.mock.calls[0][0];
  await first.unmount();
  const retry = await renderHook(() => useMapStartup(model));
  const current = createAttempt.mock.results[1].value;
  expect(oldSignal.aborted).toBe(true);
  expect(current).not.toBe(old);
  expect(current.check.mock.calls[0][0].aborted).toBe(false);
  expect(retry.result.current).toBe(current.onRendered);
});

nativeTest(
  "changed attempt callbacks abort the previous check and create a fresh attempt",
  async () => {
    const view = await renderHook(
      (props: AppStartupActions) => useMapStartup(props),
      { initialProps: startup() },
    );
    const old = createAttempt.mock.results[0].value;
    await view.rerender(startup());
    const current = createAttempt.mock.results[1].value;
    expect(old.check.mock.calls[0][0].aborted).toBe(true);
    expect(current).not.toBe(old);
    expect(current.check).toHaveBeenCalledTimes(1);
  },
);
