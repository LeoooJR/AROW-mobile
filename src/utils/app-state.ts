import type { AppStateStatus } from "react-native";

export function isAppActive(state: AppStateStatus | null): boolean {
  return state === "active";
}
