import * as Location from "expo-location";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState, type AppStateStatus, Linking } from "react-native";

import { useRealLocation } from "./use-real-location";

jest.mock("expo-location", () => ({
  Accuracy: { High: 4 },
  getForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  PermissionStatus: {
    DENIED: "denied",
    GRANTED: "granted",
    UNDETERMINED: "undetermined",
  },
  requestForegroundPermissionsAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

const getForegroundPermissionsAsync = jest.mocked(
  Location.getForegroundPermissionsAsync,
);
const hasServicesEnabledAsync = jest.mocked(Location.hasServicesEnabledAsync);
const requestForegroundPermissionsAsync = jest.mocked(
  Location.requestForegroundPermissionsAsync,
);
const watchPositionAsync = jest.mocked(Location.watchPositionAsync);

const mockAppStateRemove = jest.fn();
const mockLocationRemove = jest.fn();
let mockAppStateListener: ((state: AppStateStatus) => void) | undefined;
let mockLocationError: Location.LocationErrorCallback | undefined;
let mockLocationUpdate: Location.LocationCallback | undefined;

function permission(
  status: Location.PermissionStatus,
  canAskAgain = true,
): Location.LocationPermissionResponse {
  return {
    canAskAgain,
    expires: "never",
    granted: status === Location.PermissionStatus.GRANTED,
    status,
  };
}

function location(
  heading: number | null,
  mocked = false,
): Location.LocationObject {
  return {
    coords: {
      accuracy: 3.4,
      altitude: null,
      altitudeAccuracy: null,
      heading,
      latitude: 48.8566,
      longitude: 2.3522,
      speed: null,
    },
    mocked,
    timestamp: 1_000,
  };
}

function deferred<Value>() {
  let resolvePromise!: (value: Value | PromiseLike<Value>) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<Value>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, reject: rejectPromise, resolve: resolvePromise };
}

describe("useRealLocation", () => {
  beforeEach(() => {
    process.env.EXPO_OS = "android";
    mockAppStateListener = undefined;
    mockLocationError = undefined;
    mockLocationUpdate = undefined;
    mockAppStateRemove.mockReset();
    mockLocationRemove.mockReset();
    getForegroundPermissionsAsync.mockReset();
    hasServicesEnabledAsync.mockReset();
    requestForegroundPermissionsAsync.mockReset();
    watchPositionAsync.mockReset();

    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.UNDETERMINED),
    );
    hasServicesEnabledAsync.mockResolvedValue(true);
    requestForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    watchPositionAsync.mockImplementation(async (_options, update, error) => {
      mockLocationUpdate = update;
      mockLocationError = error;
      return { remove: mockLocationRemove };
    });
    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, listener) => {
        mockAppStateListener = listener;
        return { remove: mockAppStateRemove };
      });
    jest.spyOn(Linking, "openSettings").mockResolvedValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("reports that an undetermined permission is required", async () => {
    const hook = await renderHook(() => useRealLocation());

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "permissionRequired",
      });
    });
  });

  test("reports denied permission and whether it can be requested again", async () => {
    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.DENIED, false),
    );

    const hook = await renderHook(() => useRealLocation());

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        canAskAgain: false,
        status: "denied",
      });
    });
  });

  test("reports disabled location services", async () => {
    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    hasServicesEnabledAsync.mockResolvedValue(false);

    const hook = await renderHook(() => useRealLocation());

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "servicesDisabled",
      });
    });
    expect(watchPositionAsync).not.toHaveBeenCalled();
  });

  test("starts watching and exposes a normalized real position", async () => {
    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    const hook = await renderHook(() => useRealLocation());

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({ status: "locating" });
    });
    expect(watchPositionAsync).toHaveBeenCalledWith(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 5,
        timeInterval: 5_000,
      },
      expect.any(Function),
      expect.any(Function),
    );

    await act(async () => {
      mockLocationUpdate?.(location(725));
    });

    expect(hook.result.current.state).toEqual({
      position: {
        accuracy: 3.4,
        heading: 5,
        latitude: 48.8566,
        longitude: 2.3522,
      },
      status: "connected",
    });
  });

  test.each([null, -1, Number.POSITIVE_INFINITY])(
    "normalizes invalid heading %s to null",
    async (heading) => {
      getForegroundPermissionsAsync.mockResolvedValue(
        permission(Location.PermissionStatus.GRANTED),
      );
      const hook = await renderHook(() => useRealLocation());
      await waitFor(() => expect(mockLocationUpdate).toBeDefined());

      await act(async () => {
        mockLocationUpdate?.(location(heading));
      });

      expect(hook.result.current.state).toEqual(
        expect.objectContaining({
          position: expect.objectContaining({ heading: null }),
        }),
      );
    },
  );

  test("distinguishes a mocked location update", async () => {
    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => expect(mockLocationUpdate).toBeDefined());

    await act(async () => {
      mockLocationUpdate?.(location(180, true));
    });

    expect(hook.result.current.state).toEqual(
      expect.objectContaining({ status: "mocked" }),
    );
  });

  test("reports watcher and synchronization failures", async () => {
    getForegroundPermissionsAsync.mockRejectedValueOnce(
      new Error("permission failure"),
    );
    const hook = await renderHook(() => useRealLocation());

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({ status: "error" });
    });

    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    await act(async () => {
      hook.result.current.retry();
    });
    await waitFor(() => expect(mockLocationError).toBeDefined());

    await act(async () => {
      mockLocationError?.("unavailable");
    });
    expect(hook.result.current.state).toEqual({ status: "error" });
  });

  test("handles a denied access request", async () => {
    requestForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.DENIED, true),
    );
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "permissionRequired",
      });
    });

    await act(async () => {
      hook.result.current.requestAccess();
    });

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        canAskAgain: true,
        status: "denied",
      });
    });
  });

  test("prevents duplicate access requests and starts watching after grant", async () => {
    const request = deferred<Location.LocationPermissionResponse>();
    requestForegroundPermissionsAsync.mockReturnValue(request.promise);
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "permissionRequired",
      });
    });

    await act(async () => {
      hook.result.current.requestAccess();
      hook.result.current.requestAccess();
    });
    expect(hook.result.current.state).toEqual({ status: "requesting" });
    expect(requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve(permission(Location.PermissionStatus.GRANTED));
    });
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({ status: "locating" });
    });
  });

  test("reports a failed access request", async () => {
    requestForegroundPermissionsAsync.mockRejectedValue(
      new Error("request failed"),
    );
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "permissionRequired",
      });
    });

    await act(async () => {
      hook.result.current.requestAccess();
    });

    await waitFor(() => {
      expect(hook.result.current.state).toEqual({ status: "error" });
    });
  });

  test("stops and resumes watching across AppState changes while retaining position", async () => {
    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    const firstRemove = jest.fn();
    const secondRemove = jest.fn();
    watchPositionAsync
      .mockImplementationOnce(async (_options, update, error) => {
        mockLocationUpdate = update;
        mockLocationError = error;
        return { remove: firstRemove };
      })
      .mockImplementationOnce(async (_options, update, error) => {
        mockLocationUpdate = update;
        mockLocationError = error;
        return { remove: secondRemove };
      });
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => expect(mockLocationUpdate).toBeDefined());

    await act(async () => {
      mockLocationUpdate?.(location(45));
    });
    const retainedPosition =
      hook.result.current.state.status === "connected"
        ? hook.result.current.state.position
        : undefined;

    await act(async () => {
      mockAppStateListener?.("background");
    });
    expect(firstRemove).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockAppStateListener?.("active");
    });
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        position: retainedPosition,
        status: "locating",
      });
    });
    expect(watchPositionAsync).toHaveBeenCalledTimes(2);

    await hook.unmount();
    expect(secondRemove).toHaveBeenCalledTimes(1);
    expect(mockAppStateRemove).toHaveBeenCalledTimes(1);
  });

  test("ignores AppState synchronization while requesting permission", async () => {
    const request = deferred<Location.LocationPermissionResponse>();
    requestForegroundPermissionsAsync.mockReturnValue(request.promise);
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "permissionRequired",
      });
    });

    await act(async () => {
      hook.result.current.requestAccess();
      mockAppStateListener?.("background");
      mockAppStateListener?.("active");
    });

    expect(getForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(mockLocationRemove).not.toHaveBeenCalled();

    await act(async () => {
      request.resolve(permission(Location.PermissionStatus.DENIED));
    });
  });

  test("removes a watcher that resolves after unmount", async () => {
    getForegroundPermissionsAsync.mockResolvedValue(
      permission(Location.PermissionStatus.GRANTED),
    );
    const pendingWatcher = deferred<Location.LocationSubscription>();
    watchPositionAsync.mockReturnValue(pendingWatcher.promise);
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({ status: "locating" });
    });

    await hook.unmount();
    await act(async () => {
      pendingWatcher.resolve({ remove: mockLocationRemove });
    });

    expect(mockLocationRemove).toHaveBeenCalledTimes(1);
  });

  test("opens settings and reports a settings failure", async () => {
    const hook = await renderHook(() => useRealLocation());
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({
        status: "permissionRequired",
      });
    });

    await act(async () => {
      hook.result.current.openSettings();
    });
    expect(Linking.openSettings).toHaveBeenCalledTimes(1);
    expect(hook.result.current.state).toEqual({ status: "permissionRequired" });

    jest
      .mocked(Linking.openSettings)
      .mockRejectedValueOnce(new Error("settings unavailable"));
    await act(async () => {
      hook.result.current.openSettings();
    });
    await waitFor(() => {
      expect(hook.result.current.state).toEqual({ status: "error" });
    });
  });

  test("ignores stale permission results after unmount", async () => {
    const pendingPermission = deferred<Location.LocationPermissionResponse>();
    getForegroundPermissionsAsync.mockReturnValue(pendingPermission.promise);
    const hook = await renderHook(() => useRealLocation());

    await hook.unmount();
    await act(async () => {
      pendingPermission.resolve(permission(Location.PermissionStatus.GRANTED));
    });

    expect(hasServicesEnabledAsync).not.toHaveBeenCalled();
  });
});
