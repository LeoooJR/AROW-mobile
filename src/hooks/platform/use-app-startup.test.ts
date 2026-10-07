import { act, renderHook } from "@testing-library/react-native";
import * as SplashScreen from "expo-splash-screen";

import { useAppStartup } from "./use-app-startup";

jest.mock("expo-splash-screen", () => ({ hide: jest.fn() }));

describe("application startup", () => {
  test("Android decoded artwork releases native drawing before navigator layout", async () => {
    const view = await renderHook(() => useAppStartup("android"));
    await act(async () => view.result.current.onArtworkReady());
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    expect(view.result.current.status).toBe("loading");
    await act(async () => {
      view.result.current.onLayout();
      view.result.current.onReady();
    });
    expect(view.result.current.status).toBe("ready");
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  test("waits for both the map and application layout, then hides only once", async () => {
    const view = await renderHook(useAppStartup);
    await act(async () => view.result.current.onReady());
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    await act(async () => view.result.current.onLayout());
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    await act(async () => {
      view.result.current.onReady();
      view.result.current.onFailure();
      jest.advanceTimersByTime(30_000);
    });
    expect(view.result.current.status).toBe("ready");
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  test("layout alone does not dismiss the splash", async () => {
    const view = await renderHook(useAppStartup);
    await act(async () => view.result.current.onLayout());
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    await act(async () => view.result.current.onReady());
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  test("timeout reveals an error only after its fallback has laid out", async () => {
    const view = await renderHook(useAppStartup);
    await act(async () => jest.advanceTimersByTime(29_999));
    expect(view.result.current.status).toBe("loading");
    await act(async () => jest.advanceTimersByTime(1));
    expect(view.result.current.status).toBe("error");
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    await act(async () => view.result.current.onFallbackLayout());
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  test("retry ignores previous attempt callbacks and gets a fresh timeout", async () => {
    const view = await renderHook(useAppStartup);
    const oldReady = view.result.current.onReady;
    const oldFailure = view.result.current.onFailure;
    await act(async () => {
      view.result.current.onLayout();
      view.result.current.onFailure();
    });
    await act(async () => view.result.current.onFallbackLayout());
    await act(async () => view.result.current.retry());
    expect(view.result.current.attempt).toBe(1);
    await act(async () => {
      oldReady();
      oldFailure();
    });
    expect(view.result.current.status).toBe("loading");
    await act(async () => view.result.current.onReady());
    expect(view.result.current.status).toBe("ready");
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });

  test("unmount clears the startup timeout", async () => {
    const schedule = jest.spyOn(global, "setTimeout");
    const cancel = jest.spyOn(global, "clearTimeout");
    const view = await renderHook(useAppStartup);
    const timerIndex = schedule.mock.calls.findIndex(
      (call) => call[1] === 30_000,
    );
    expect(timerIndex).toBeGreaterThanOrEqual(0);
    const timer = schedule.mock.results[timerIndex].value;
    await view.unmount();
    expect(cancel).toHaveBeenCalledWith(timer);
    schedule.mockRestore();
    cancel.mockRestore();
  });

  test("web startup uses no native splash or loading timeout", async () => {
    const view = await renderHook(() => useAppStartup("web"));
    await act(async () => view.result.current.onLayout());
    expect(view.result.current.status).toBe("ready");
    expect(SplashScreen.hide).not.toHaveBeenCalled();
  });

  test("Android hands off to in-app loading before waiting for MapLibre to render", async () => {
    const view = await renderHook(() => useAppStartup("android"));
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    await act(async () => view.result.current.onLayout());
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    await act(async () => view.result.current.onArtworkReady());
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
    expect(view.result.current.status).toBe("loading");
    await act(async () => view.result.current.onReady());
    expect(view.result.current.status).toBe("ready");
    expect(SplashScreen.hide).toHaveBeenCalledTimes(1);
  });
});
