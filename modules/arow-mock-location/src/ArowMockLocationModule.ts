import { NativeModule, requireNativeModule } from "expo";

export interface NativeReadiness {
  readonly ready: boolean;
  readonly code?: string;
}

export interface NativeSnapshot {
  readonly status: "stopped" | "starting" | "running" | "error";
  readonly latitude?: number;
  readonly longitude?: number;
  readonly code?: string;
}

declare class ArowMockLocationModule extends NativeModule {
  checkReadiness(): Promise<NativeReadiness>;
  getSnapshot(): Promise<NativeSnapshot>;
  start(latitude: number, longitude: number): Promise<NativeSnapshot>;
  stop(): Promise<NativeSnapshot>;
}

export default requireNativeModule<ArowMockLocationModule>("ArowMockLocation");
