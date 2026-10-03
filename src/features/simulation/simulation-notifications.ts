import { AppState, PermissionsAndroid } from "react-native";

import { isAppActive } from "@/utils/app-state";
import { isAndroidVersionAtLeast } from "@/utils/platform";

export type NotificationPreparation =
  | { readonly status: "ready"; readonly notificationVisible: boolean }
  | { readonly status: "cancelled" };

export async function prepareSimulationNotifications(
  canShowNotification: () => Promise<boolean>,
): Promise<NotificationPreparation> {
  if (!isAppActive(AppState.currentState)) return { status: "cancelled" };
  if (isAndroidVersionAtLeast(33)) {
    const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
    const granted = await PermissionsAndroid.check(permission);
    if (!isAppActive(AppState.currentState)) return { status: "cancelled" };
    if (!granted) {
      await PermissionsAndroid.request(permission);
    }
  }
  if (!isAppActive(AppState.currentState)) return { status: "cancelled" };
  const notificationVisible = await canShowNotification();
  return isAppActive(AppState.currentState)
    ? { status: "ready", notificationVisible }
    : { status: "cancelled" };
}
