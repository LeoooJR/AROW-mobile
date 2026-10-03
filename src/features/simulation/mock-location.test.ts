import nativeExecutor from "../../../modules/arow-mock-location/src/ArowMockLocationModule";
import { getMockLocationExecutor } from "./mock-location";
import { prepareSimulationNotifications } from "./simulation-notifications";
import { Platform } from "react-native";

jest.mock(
  "../../../modules/arow-mock-location/src/ArowMockLocationModule",
  () => ({
    __esModule: true,
    default: {
      canShowSimulationNotification: jest.fn(),
      checkReadiness: jest.fn(),
      getSnapshot: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    },
  }),
);
jest.mock("./simulation-notifications", () => ({
  prepareSimulationNotifications: jest.fn(),
}));

test("composes permission preparation without changing native operation ownership", async () => {
  // Expo's Jest transform fixes EXPO_OS to the selected preset at compile time.
  if (Platform.OS !== "android") {
    await expect(getMockLocationExecutor()).rejects.toThrow(
      "UNSUPPORTED_PLATFORM",
    );
    expect(prepareSimulationNotifications).not.toHaveBeenCalled();
    return;
  }
  process.env.EXPO_OS = "android";
  jest
    .mocked(prepareSimulationNotifications)
    .mockResolvedValue({ status: "ready", notificationVisible: false });
  const executor = await getMockLocationExecutor();
  expect(executor.start).toBe(nativeExecutor.start);
  expect(executor.stop).toBe(nativeExecutor.stop);
  expect(prepareSimulationNotifications).not.toHaveBeenCalled();
  await expect(executor.prepareNotifications()).resolves.toEqual({
    status: "ready",
    notificationVisible: false,
  });
  expect(prepareSimulationNotifications).toHaveBeenCalledWith(
    nativeExecutor.canShowSimulationNotification,
  );
});
