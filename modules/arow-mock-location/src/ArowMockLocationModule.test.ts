import { requireNativeModule } from "expo";

import executor from "./ArowMockLocationModule";
import { NativeContractError } from "./decode-native-result";

jest.mock("expo", () => ({
  NativeModule: class {},
  requireNativeModule: jest.fn(() => ({
    canShowSimulationNotification: jest.fn(),
    checkReadiness: jest.fn(),
    getSnapshot: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

const bridge = jest.mocked(requireNativeModule).mock.results[0].value;

test.each([true, false])(
  "decodes notification visibility %s",
  async (visible) => {
    bridge.canShowSimulationNotification.mockResolvedValue(visible);
    await expect(executor.canShowSimulationNotification()).resolves.toBe(
      visible,
    );
  },
);

test.each([undefined, null, 1, "true", {}])(
  "rejects invalid notification visibility %j",
  async (value) => {
    bridge.canShowSimulationNotification.mockResolvedValue(value);
    await expect(
      executor.canShowSimulationNotification(),
    ).rejects.toBeInstanceOf(NativeContractError);
  },
);

test("decodes each native operation before exposing it to callers", async () => {
  bridge.checkReadiness.mockResolvedValue({ ready: true });
  bridge.getSnapshot.mockResolvedValue({
    status: "starting",
    latitude: 0,
    longitude: 0,
  });
  bridge.start.mockResolvedValue({
    status: "running",
    latitude: 1,
    longitude: 2,
  });
  bridge.stop.mockResolvedValue({ status: "stopped" });
  await expect(executor.checkReadiness()).resolves.toEqual({ ready: true });
  await expect(executor.getSnapshot()).resolves.toEqual({
    status: "starting",
    latitude: 0,
    longitude: 0,
  });
  await expect(executor.start(1, 2)).resolves.toEqual({
    status: "running",
    latitude: 1,
    longitude: 2,
  });
  expect(bridge.start).toHaveBeenCalledWith(1, 2);
  await expect(executor.stop()).resolves.toEqual({ status: "stopped" });
});

test("rejects malformed bridge responses instead of acknowledging success", async () => {
  bridge.checkReadiness.mockResolvedValue({ ready: false });
  bridge.getSnapshot.mockResolvedValue({ status: "running" });
  bridge.start.mockResolvedValue({ status: "running", latitude: 0 });
  bridge.stop.mockResolvedValue({
    status: "running",
    latitude: 0,
    longitude: 0,
  });
  await expect(executor.checkReadiness()).rejects.toBeInstanceOf(
    NativeContractError,
  );
  await expect(executor.getSnapshot()).rejects.toBeInstanceOf(
    NativeContractError,
  );
  await expect(executor.start(0, 0)).rejects.toBeInstanceOf(
    NativeContractError,
  );
  await expect(executor.stop()).rejects.toBeInstanceOf(NativeContractError);
});
