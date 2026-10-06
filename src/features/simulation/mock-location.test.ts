import nativeExecutor from "../../../modules/arow-mock-location/src/ArowMockLocationModule";
import { getMockLocationExecutor } from "./mock-location";
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
test("loads native simulation operations without notification preparation", async () => {
  // Expo's Jest transform fixes EXPO_OS to the selected preset at compile time.
  if (Platform.OS !== "android") {
    await expect(getMockLocationExecutor()).rejects.toThrow(
      "UNSUPPORTED_PLATFORM",
    );
    return;
  }
  process.env.EXPO_OS = "android";
  const executor = await getMockLocationExecutor();
  expect(executor.start).toBe(nativeExecutor.start);
  expect(executor.stop).toBe(nativeExecutor.stop);
  expect(executor).not.toHaveProperty("prepareNotifications");
});
