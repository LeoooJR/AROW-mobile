import { AppState, PermissionsAndroid, Platform } from "react-native";

import { prepareSimulationNotifications } from "./simulation-notifications";

const visibility = jest.fn();
const originalOS = Platform.OS;
const originalState = AppState.currentState;

beforeEach(() => {
  jest.clearAllMocks();
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
    await expect(prepareSimulationNotifications(visibility)).resolves.toEqual({
      status: "ready",
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
  await expect(prepareSimulationNotifications(visibility)).resolves.toEqual({
    status: "ready",
    notificationVisible: false,
  });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
});

test("older Android skips the runtime permission request", async () => {
  jest.spyOn(Platform, "Version", "get").mockReturnValue(32);
  await prepareSimulationNotifications(visibility);
  expect(PermissionsAndroid.check).not.toHaveBeenCalled();
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).toHaveBeenCalled();
});

test.each(["ios", "web"] as const)(
  "%s skips Android consent regardless of its version",
  async (platform) => {
    Platform.OS = platform;
    jest.spyOn(Platform, "Version", "get").mockReturnValue("33");
    await expect(prepareSimulationNotifications(visibility)).resolves.toEqual({
      status: "ready",
      notificationVisible: true,
    });
    expect(PermissionsAndroid.check).not.toHaveBeenCalled();
    expect(PermissionsAndroid.request).not.toHaveBeenCalled();
    expect(visibility).toHaveBeenCalledTimes(1);
  },
);

test("inactive applications cancel before requesting", async () => {
  AppState.currentState = "background";
  await expect(prepareSimulationNotifications(visibility)).resolves.toEqual({
    status: "cancelled",
  });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).not.toHaveBeenCalled();
});

test("leaving the app during preparation prevents startup", async () => {
  jest.mocked(PermissionsAndroid.request).mockImplementation(async () => {
    AppState.currentState = "background";
    return "denied";
  });
  await expect(prepareSimulationNotifications(visibility)).resolves.toEqual({
    status: "cancelled",
  });
});

test("leaving during the permission check never opens a background prompt", async () => {
  jest.mocked(PermissionsAndroid.check).mockImplementation(async () => {
    AppState.currentState = "background";
    return false;
  });
  await expect(prepareSimulationNotifications(visibility)).resolves.toEqual({
    status: "cancelled",
  });
  expect(PermissionsAndroid.request).not.toHaveBeenCalled();
  expect(visibility).not.toHaveBeenCalled();
});

test.each(["request", "visibility"])(
  "propagates %s failures",
  async (source) => {
    const error = new Error("unavailable");
    if (source === "request")
      jest.mocked(PermissionsAndroid.request).mockRejectedValue(error);
    else visibility.mockRejectedValue(error);
    await expect(prepareSimulationNotifications(visibility)).rejects.toBe(
      error,
    );
  },
);
