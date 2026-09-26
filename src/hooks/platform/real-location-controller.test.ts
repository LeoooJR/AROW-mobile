import { waitFor } from "@testing-library/react-native";

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

function setup(enabled = true) {
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
  const controller = new RealLocationController(source, enabled);
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
