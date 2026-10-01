import { NativeModule, requireNativeModule } from "expo";

import {
  decodeReadiness,
  decodeSnapshot,
  decodeStartResult,
  decodeStopResult,
} from "./decode-native-result";

declare class ArowMockLocationModule extends NativeModule {
  checkReadiness(): Promise<unknown>;
  getSnapshot(): Promise<unknown>;
  start(latitude: number, longitude: number): Promise<unknown>;
  stop(): Promise<unknown>;
}

const nativeModule =
  requireNativeModule<ArowMockLocationModule>("ArowMockLocation");
export default {
  checkReadiness: async () =>
    decodeReadiness(await nativeModule.checkReadiness()),
  getSnapshot: async () => decodeSnapshot(await nativeModule.getSnapshot()),
  start: async (latitude: number, longitude: number) =>
    decodeStartResult(await nativeModule.start(latitude, longitude)),
  stop: async () => decodeStopResult(await nativeModule.stop()),
};
