export const NATIVE_READINESS_ERROR_CODES = [
  "MOCK_PROVIDER_NOT_SELECTED",
  "LOCATION_SERVICES_DISABLED",
  "LOCATION_PERMISSION_REQUIRED",
  "READINESS_CHECK_FAILED",
] as const;

export type NativeReadinessErrorCode =
  (typeof NATIVE_READINESS_ERROR_CODES)[number];
export const NATIVE_ERROR_CODES = [
  ...NATIVE_READINESS_ERROR_CODES,
  "START_FAILED",
  "APPLY_FAILED",
  "CLEANUP_FAILED",
] as const;
export type NativeErrorCode = (typeof NATIVE_ERROR_CODES)[number];

export type NativeReadiness =
  | { readonly ready: true }
  | { readonly ready: false; readonly code: NativeReadinessErrorCode };

export interface NativeStoppedSnapshot {
  readonly status: "stopped";
}
export interface NativeStartingSnapshot {
  readonly status: "starting";
  readonly latitude: number;
  readonly longitude: number;
}
export interface NativeRunningSnapshot {
  readonly status: "running";
  readonly latitude: number;
  readonly longitude: number;
}
export interface NativeErrorSnapshot {
  readonly status: "error";
  readonly code: NativeErrorCode;
  readonly ownsProviders: boolean;
}
export type NativeStartResult =
  NativeRunningSnapshot | NativeErrorSnapshot | NativeStoppedSnapshot;
export type NativeStopResult = NativeStoppedSnapshot | NativeErrorSnapshot;
export type NativeSnapshot = NativeStartingSnapshot | NativeStartResult;
