import { waitFor } from "@testing-library/react-native";
import type { AppStateStatus } from "react-native";

import { RealLocationController } from "./real-location-controller";
import type {
  LocationPermission,
  LocationUpdate,
  LocationWatcher,
  RealLocationSource,
} from "./real-location-source";

const granted: LocationPermission = {
  granted: true,
  canAskAgain: true,
  undetermined: false,
};
const update: LocationUpdate = {
  mocked: false,
  position: { latitude: 1, longitude: 2, heading: null, accuracy: 3 },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function setup(
  enabled = true,
  initialAppState: AppStateStatus | null = "active",
) {
  const source = {
    getPermission: jest
      .fn<ReturnType<RealLocationSource["getPermission"]>, []>()
      .mockResolvedValue(granted),
    requestPermission: jest
      .fn<ReturnType<RealLocationSource["requestPermission"]>, []>()
      .mockResolvedValue(granted),
    hasServicesEnabled: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
    watch: jest
      .fn<
        ReturnType<RealLocationSource["watch"]>,
        Parameters<RealLocationSource["watch"]>
      >()
      .mockResolvedValue({ remove: jest.fn() }),
    openSettings: jest.fn<Promise<void>, []>().mockResolvedValue(undefined),
  } satisfies RealLocationSource;
  const controller = new RealLocationController(
    source,
    enabled,
    initialAppState,
  );
  const listener = jest.fn();
  const unsubscribe = controller.subscribe(listener);
  return { controller, source, listener, unsubscribe };
}

test("ignores a permission check superseded by retry", async () => {
  const { controller, source } = setup();
  const permission = deferred<LocationPermission>();
  source.getPermission.mockReturnValueOnce(permission.promise);
  controller.retry();
  controller.retry();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  permission.resolve({
    granted: false,
    canAskAgain: false,
    undetermined: false,
  });
  await permission.promise;
  expect(controller.state.status).toBe("locating");
});

test("ignores services results after backgrounding", async () => {
  const { controller, source } = setup();
  const services = deferred<boolean>();
  source.hasServicesEnabled.mockReturnValue(services.promise);
  await waitFor(() =>
    expect(source.hasServicesEnabled).toHaveBeenCalledTimes(1),
  );
  controller.onAppStateChange("background");
  services.resolve(true);
  await services.promise;
  expect(source.watch).not.toHaveBeenCalled();
});

test("waits for foreground before starting a watcher after a backgrounded permission request", async () => {
  const { controller, source } = setup();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  const request = deferred<LocationPermission>();
  source.requestPermission.mockReturnValueOnce(request.promise);

  controller.requestAccess();
  controller.onAppStateChange("background");
  controller.requestAccess();
  controller.retry();
  request.resolve(granted);
  await request.promise;
  expect(source.requestPermission).toHaveBeenCalledTimes(1);
  expect(source.watch).toHaveBeenCalledTimes(1);

  controller.onAppStateChange("active");
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(2));
  expect(source.getPermission).toHaveBeenCalledTimes(2);
});

test("defers one foreground recheck until a permission dialog settles", async () => {
  const { controller, source } = setup();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  const request = deferred<LocationPermission>();
  source.requestPermission.mockReturnValueOnce(request.promise);

  controller.requestAccess();
  controller.onAppStateChange("background");
  controller.onAppStateChange("active");
  controller.onAppStateChange("active");
  expect(source.getPermission).toHaveBeenCalledTimes(1);
  expect(source.watch).toHaveBeenCalledTimes(1);
  request.resolve(granted);

  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(2));
  expect(source.requestPermission).toHaveBeenCalledTimes(1);
  expect(source.getPermission).toHaveBeenCalledTimes(2);
});

test("removes a watcher returned after backgrounding during an access request", async () => {
  const { controller, source } = setup();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  const late = deferred<LocationWatcher>();
  const removeLate = jest.fn();
  const removeResumed = jest.fn();
  source.watch
    .mockReturnValueOnce(late.promise)
    .mockResolvedValueOnce({ remove: removeResumed });

  controller.requestAccess();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(2));
  controller.onAppStateChange("background");
  controller.onAppStateChange("active");
  late.resolve({ remove: removeLate });

  await waitFor(() => expect(removeLate).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(3));
  expect(removeResumed).not.toHaveBeenCalled();
});

test("rechecks denied permission after the dialog returns from background", async () => {
  const { controller, source } = setup();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  const request = deferred<LocationPermission>();
  const denied = {
    granted: false,
    canAskAgain: false,
    undetermined: false,
  };
  source.requestPermission.mockReturnValueOnce(request.promise);
  source.getPermission.mockResolvedValue(denied);

  controller.requestAccess();
  controller.onAppStateChange("background");
  controller.onAppStateChange("active");
  request.resolve(denied);

  await waitFor(() =>
    expect(controller.state).toEqual({ status: "denied", canAskAgain: false }),
  );
  expect(source.watch).toHaveBeenCalledTimes(1);
  expect(source.requestPermission).toHaveBeenCalledTimes(1);
});

test("rechecks permission after a backgrounded request rejects", async () => {
  const { controller, source } = setup();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  let rejectRequest!: (reason: Error) => void;
  source.requestPermission.mockReturnValueOnce(
    new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }),
  );

  controller.requestAccess();
  controller.onAppStateChange("background");
  controller.onAppStateChange("active");
  rejectRequest(new Error("permission unavailable"));

  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(2));
  expect(source.getPermission).toHaveBeenCalledTimes(2);
  expect(source.requestPermission).toHaveBeenCalledTimes(1);
  expect(controller.state.status).toBe("locating");
});

test("does not check location until an initially backgrounded app becomes active", async () => {
  const { controller, source } = setup(true, "background");
  expect(source.getPermission).not.toHaveBeenCalled();
  controller.retry();
  expect(source.getPermission).not.toHaveBeenCalled();

  controller.onAppStateChange("active");
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
});

test.each([null, "unknown"] as const)(
  "treats launch state %s as active",
  async (initialAppState) => {
    const { source } = setup(true, initialAppState);
    await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  },
);

test("removes a late watcher without replacing the resumed watcher", async () => {
  const { controller, source } = setup();
  const late = deferred<LocationWatcher>();
  const lateRemove = jest.fn();
  const activeRemove = jest.fn();
  source.watch
    .mockReturnValueOnce(late.promise)
    .mockResolvedValueOnce({ remove: activeRemove });
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  const [staleUpdate, staleError] = source.watch.mock.calls[0];
  controller.onAppStateChange("background");
  controller.onAppStateChange("active");
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(2));
  source.watch.mock.calls[1][0](update);
  staleUpdate({ ...update, mocked: true });
  staleError();
  expect(controller.state).toEqual({
    status: "connected",
    position: update.position,
  });
  late.resolve({ remove: lateRemove });
  await waitFor(() => expect(lateRemove).toHaveBeenCalledTimes(1));
  expect(activeRemove).not.toHaveBeenCalled();
  controller.onAppStateChange("background");
  expect(activeRemove).toHaveBeenCalledTimes(1);
});

test("remount checks permission and ignores an older request's completion", async () => {
  const { controller, source, unsubscribe } = setup();
  const request = deferred<LocationPermission>();
  source.requestPermission.mockReturnValueOnce(request.promise);
  controller.requestAccess();
  unsubscribe();
  const detach = controller.subscribe(jest.fn());
  controller.requestAccess();
  await waitFor(() => expect(source.watch).toHaveBeenCalledTimes(1));
  request.resolve({ granted: false, canAskAgain: false, undetermined: false });
  await request.promise;
  expect(controller.state.status).toBe("locating");
  detach();
});

test("does not let a stale settings failure replace resumed state", async () => {
  const { controller, source } = setup();
  let reject!: (error: Error) => void;
  source.openSettings.mockReturnValue(
    new Promise((_, fail) => {
      reject = fail;
    }),
  );
  controller.openSettings();
  controller.onAppStateChange("background");
  controller.onAppStateChange("active");
  await waitFor(() => expect(controller.state.status).toBe("locating"));
  reject(new Error("unavailable"));
  await source.openSettings.mock.results[0].value.catch(() => undefined);
  expect(controller.state.status).toBe("locating");
});

test("web does not check, request, or watch location", () => {
  const { controller, source, unsubscribe } = setup(false);
  controller.requestAccess();
  controller.retry();
  controller.onAppStateChange("active");
  expect(source.getPermission).not.toHaveBeenCalled();
  expect(source.requestPermission).not.toHaveBeenCalled();
  expect(source.watch).not.toHaveBeenCalled();
  unsubscribe();
});
