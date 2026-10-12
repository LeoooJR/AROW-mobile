import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { Platform } from "react-native";

import ToastMessage from "./toast-message";

jest.mock("@gluestack-ui/core/toast/creator", () => ({
  createToastHook: () => jest.fn(),
}));

test.each([
  ["info", "Information", "status", "polite"],
  ["success", "Succès", "status", "polite"],
  ["warning", "Avertissement", "status", "polite"],
  ["error", "Erreur", "alert", "assertive"],
] as const)(
  "%s exposes its severity and announcement without moving focus",
  async (severity, label, role, liveRegion) => {
    const onDismiss = jest.fn();
    await render(
      <ToastMessage
        severity={severity}
        message="Message suffisamment long pour revenir à la ligne sur un écran étroit."
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByRole(role)).toHaveProp(
      "accessibilityLiveRegion",
      liveRegion,
    );
    expect(screen.getByText(label)).toBeOnTheScreen();
    expect(screen.getByText(/^Message suffisamment long/)).not.toHaveProp(
      "numberOfLines",
    );
    const close = screen.getByRole("button", { name: "Fermer le message" });
    expect(close).not.toHaveProp("autoFocus");
    await userEvent.setup().press(close);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  },
);

test("Escape from inside a web toast dismisses it without escaping to the map", async () => {
  const previousPlatform = Platform.OS;
  Platform.OS = "web";
  try {
    const onDismiss = jest.fn();
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    await render(
      <ToastMessage
        severity="warning"
        message="Notifications désactivées."
        onDismiss={onDismiss}
        testID="web-toast"
      />,
    );
    expect(screen.getByTestId("web-toast")).toHaveProp("pointerEvents", "auto");
    const close = screen.getByRole("button", { name: "Fermer le message" });
    await fireEvent(close, "keyDown", {
      key: "Escape",
      preventDefault,
      stopPropagation,
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);
  } finally {
    Platform.OS = previousPlatform;
  }
});
