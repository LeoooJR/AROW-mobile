import type {
  NativeReadiness,
  NativeSnapshot,
} from "../../../modules/arow-mock-location/src/ArowMockLocationModule";

export interface MockLocationExecutor {
  checkReadiness(): Promise<NativeReadiness>;
  getSnapshot(): Promise<NativeSnapshot>;
  start(latitude: number, longitude: number): Promise<NativeSnapshot>;
  stop(): Promise<NativeSnapshot>;
}

export async function getMockLocationExecutor(): Promise<MockLocationExecutor> {
  if (process.env.EXPO_OS !== "android") {
    throw new Error("UNSUPPORTED_PLATFORM");
  }

  return (
    await import("../../../modules/arow-mock-location/src/ArowMockLocationModule")
  ).default;
}
