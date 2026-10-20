import { AppState, PermissionsAndroid } from "react-native";

import { isAppActive } from "@/utils/app-state";
import { isAndroidVersionAtLeast } from "@/utils/platform";

export interface NotificationPreparation {
  readonly notificationVisible: boolean;
}

async function canShowSimulationNotification(): Promise<boolean> {
  if (process.env.EXPO_OS !== "android") return false;
  const native = (
    await import("../../../modules/arow-mock-location/src/ArowMockLocationModule")
  ).default;
  return native.canShowSimulationNotification();
}

export async function prepareSimulationNotifications(
  isCurrent: () => boolean,
  canShowNotification: () => Promise<boolean> = canShowSimulationNotification,
): Promise<NotificationPreparation> {
  if (!isCurrent()) return { notificationVisible: false };
  if (isAndroidVersionAtLeast(33) && isAppActive(AppState.currentState)) {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    const granted = await PermissionsAndroid.check(permission);
    if (!isCurrent()) return { notificationVisible: false };
    if (!granted && isAppActive(AppState.currentState)) {
      await PermissionsAndroid.request(permission);
    }
  }
  if (!isCurrent()) return { notificationVisible: false };
  const notificationVisible = await canShowNotification();
  return { notificationVisible };
}
