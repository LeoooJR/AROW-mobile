import { AppState, PermissionsAndroid, Platform } from "react-native";

import { prepareSimulationNotifications } from "./simulation-notifications";

const visibility = jest.fn();
const isCurrent = jest.fn();
const originalOS = Platform.OS;
const originalState = AppState.currentState;

beforeEach(() => {
  jest.clearAllMocks();
  isCurrent.mockReturnValue(true);
  jest.spyOn(Platform, "Version", "get").mockReturnValue(33);
  Platform.OS = "android";
  AppState.currentState = "active";
  jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(false);
  jest.spyOn(PermissionsAndroid, "request").mockResolvedValue("granted");
  visibility.mockResolvedValue(true);
});

afterEach(() => {
  jest.restoreAllMocks();
  Platform.OS = originalOS;
  AppState.currentState = originalState;
});

test.each(["granted", "denied", "never_ask_again"] as const)(
  "requests contextually and continues after %s using actual visibility",
  async (result) => {
    jest.mocked(PermissionsAndroid.request).mockResolvedValue(result);
    visibility.mockResolvedValue(result === "granted");
    await expect(
      prepareSimulationNotifications(isCurrent, visibility),
    ).resolves.toEqual({
      notificationVisible: result === "granted",
    });
    expect(PermissionsAndroid.request).toHaveBeenCalledWith(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    expect(visibility).toHaveBeenCalledTimes(1);
  },
);

test("already granted consent still checks disabled notifications or channel", async () => {
  jest.mocked(PermissionsAndroid.check).mockResolvedValue(true);
  visibility.mockResolvedValue(false);
  await expect(
    prepareSimulationNotifications(isCurrent, visibility),
  ).resolves.toEqual({
    notificationVisible: false,
  });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
});

test("older Android skips the runtime permission request", async () => {
  jest.spyOn(Platform, "Version", "get").mockReturnValue(32);
  await prepareSimulationNotifications(isCurrent, visibility);
  expect(PermissionsAndroid.check).not.toHaveBeenCalled();
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).toHaveBeenCalled();
});

test.each(["ios", "web"] as const)(
  "%s skips Android consent regardless of its version",
  async (platform) => {
    Platform.OS = platform;
    jest.spyOn(Platform, "Version", "get").mockReturnValue("33");
    await expect(
      prepareSimulationNotifications(isCurrent, visibility),
    ).resolves.toEqual({
      notificationVisible: true,
    });
    expect(PermissionsAndroid.check).not.toHaveBeenCalled();
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    expect(visibility).toHaveBeenCalledTimes(1);
  },
);

test("inactive applications skip requesting without a cancellation result", async () => {
  AppState.currentState = "background";
  await expect(
    prepareSimulationNotifications(isCurrent, visibility),
  ).resolves.toEqual({
    notificationVisible: false,
  });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).not.toHaveBeenCalled();
});

test("a permission dialog resolving before activity resume still queries visibility", async () => {
  jest.mocked(PermissionsAndroid.request).mockImplementation(async () => {
    AppState.currentState = "background";
    return "denied";
  });
  await expect(
    prepareSimulationNotifications(isCurrent, visibility),
  ).resolves.toEqual({
    notificationVisible: true,
  });
  expect(visibility).toHaveBeenCalledTimes(1);
});

test("leaving during the permission check never opens a background prompt", async () => {
  jest.mocked(PermissionsAndroid.check).mockImplementation(async () => {
    AppState.currentState = "background";
    return false;
  });
  await expect(
    prepareSimulationNotifications(isCurrent, visibility),
  ).resolves.toEqual({
    notificationVisible: false,
  });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).not.toHaveBeenCalled();
});

test("Stop during permission checking prevents a later prompt", async () => {
  jest.mocked(PermissionsAndroid.check).mockImplementation(async () => {
    isCurrent.mockReturnValue(false);
    return false;
  });
  await expect(
    prepareSimulationNotifications(isCurrent, visibility),
  ).resolves.toEqual({ notificationVisible: false });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).not.toHaveBeenCalled();
});

test("Stop during the permission dialog skips its stale visibility query", async () => {
  jest.mocked(PermissionsAndroid.request).mockImplementation(async () => {
    isCurrent.mockReturnValue(false);
    return "granted";
  });
  await expect(
    prepareSimulationNotifications(isCurrent, visibility),
  ).resolves.toEqual({ notificationVisible: false });
  expect(visibility).not.toHaveBeenCalled();
});

test.each(["check", "request", "visibility"])(
  "propagates %s failures",
  async (source) => {
    const error = new Error("unavailable");
    if (source === "check")
      jest.mocked(PermissionsAndroid.check).mockRejectedValue(error);
    else if (source === "request")
      jest.mocked(PermissionsAndroid.request).mockRejectedValue(error);
    else visibility.mockRejectedValue(error);
    await expect(
      prepareSimulationNotifications(isCurrent, visibility),
    ).rejects.toBe(error);
  },
);
