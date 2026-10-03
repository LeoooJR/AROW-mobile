import { isLatitude, isLongitude, isRecord } from "@shared/value-validation";
import {
  NATIVE_ERROR_CODES,
  NATIVE_READINESS_ERROR_CODES,
  type NativeErrorCode,
  type NativeReadinessErrorCode,
  type NativeReadiness,
  type NativeSnapshot,
  type NativeStartResult,
  type NativeStopResult,
} from "./native-contracts";

export class NativeContractError extends Error {
  constructor(operation: string) {
    super(`Invalid mock-location ${operation} response`);
    this.name = "NativeContractError";
  }
}

export function decodeNotificationVisibility(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new NativeContractError("notification visibility");
  }
  return value;
}
function isReadinessCode(value: unknown): value is NativeReadinessErrorCode {
  return NATIVE_READINESS_ERROR_CODES.some((code) => code === value);
}
function isErrorCode(value: unknown): value is NativeErrorCode {
  return NATIVE_ERROR_CODES.some((code) => code === value);
}
export function decodeReadiness(value: unknown): NativeReadiness {
  if (isRecord(value)) {
    if (value.ready === true) return { ready: true };
    if (value.ready === false && isReadinessCode(value.code)) {
      return { ready: false, code: value.code };
    }
  }
  throw new NativeContractError("readiness");
}
export function decodeSnapshot(value: unknown): NativeSnapshot {
  if (!isRecord(value)) throw new NativeContractError("snapshot");
  switch (value.status) {
    case "stopped":
      return { status: "stopped" };
    case "starting":
    case "running":
      if (isLatitude(value.latitude) && isLongitude(value.longitude)) {
        return {
          status: value.status,
          latitude: value.latitude,
          longitude: value.longitude,
        };
      }
      break;
    case "error":
      if (isErrorCode(value.code) && typeof value.ownsProviders === "boolean") {
        return {
          status: "error",
          code: value.code,
          ownsProviders: value.ownsProviders,
        };
      }
  }
  throw new NativeContractError("snapshot");
}
export function decodeStartResult(value: unknown): NativeStartResult {
  const snapshot = decodeSnapshot(value);
  if (snapshot.status === "starting") throw new NativeContractError("start");
  return snapshot;
}
export function decodeStopResult(value: unknown): NativeStopResult {
  const snapshot = decodeSnapshot(value);
  if (snapshot.status === "starting" || snapshot.status === "running") {
    throw new NativeContractError("stop");
  }
  return snapshot;
}
