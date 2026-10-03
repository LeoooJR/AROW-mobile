import { Platform } from "react-native";

export function isAndroidVersionAtLeast(minimumVersion: number): boolean {
  return (
    Platform.OS === "android" && Number(Platform.Version) >= minimumVersion
  );
}
