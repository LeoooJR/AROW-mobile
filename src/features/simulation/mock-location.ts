import type {
  NativeReadiness,
  NativeSnapshot,
  NativeStartResult,
  NativeStopResult,
} from "../../../modules/arow-mock-location/src/native-contracts";

export interface MockLocationExecutor {
  checkReadiness(): Promise<NativeReadiness>;
  getSnapshot(): Promise<NativeSnapshot>;
  start(latitude: number, longitude: number): Promise<NativeStartResult>;
  stop(): Promise<NativeStopResult>;
}

export async function getMockLocationExecutor(): Promise<MockLocationExecutor> {
  if (process.env.EXPO_OS !== "android") {
    throw new Error("UNSUPPORTED_PLATFORM");
  }

  return (
    await import("../../../modules/arow-mock-location/src/ArowMockLocationModule")
  ).default;
}
