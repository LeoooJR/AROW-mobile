import { render, screen } from "@testing-library/react-native";

import { Toast, ToastDescription, ToastTitle } from "./index";

jest.mock("@gluestack-ui/core/toast/creator", () => ({
  createToastHook: () => jest.fn(),
}));

describe("Toast", () => {
  test("renders the default solid presentation", async () => {
    await render(
      <Toast testID="toast">
        <ToastTitle>Connexion</ToastTitle>
        <ToastDescription>Position disponible</ToastDescription>
      </Toast>,
    );

    expect(screen.getByTestId("toast")).toHaveProp(
      "className",
      "gap-1 rounded-md p-4 border border-border bg-popover bg-popover",
    );
    expect(screen.getByText("Connexion")).toHaveProp(
      "className",
      "text-base font-medium text-popover-foreground",
    );
    expect(screen.getByText("Position disponible")).toHaveProp(
      "className",
      "text-base text-muted-foreground",
    );
  });

  test("honors variants, class overrides, native props, and refs", async () => {
    const toastRef = { current: null };

    await render(
      <Toast
        action="success"
        className="custom-toast"
        ref={toastRef}
        testID="toast"
        variant="outline"
      >
        <ToastTitle className="custom-title">Titre</ToastTitle>
        <ToastDescription className="custom-description">
          Description
        </ToastDescription>
      </Toast>,
    );

    expect(screen.getByTestId("toast")).toHaveProp("className", "custom-toast");
    expect(screen.getByText("Titre")).toHaveProp("className", "custom-title");
    expect(screen.getByText("Description")).toHaveProp(
      "className",
      "custom-description",
    );
    expect(toastRef.current).not.toBeNull();
  });

  test.each([
    ["error", "outline"],
    ["info", "solid"],
    ["warning", "outline"],
  ] as const)(
    "supports the %s action with the %s variant",
    async (action, variant) => {
      await render(<Toast action={action} testID="toast" variant={variant} />);

      expect(screen.getByTestId("toast")).toHaveProp(
        "className",
        expect.stringContaining("bg-popover"),
      );
    },
  );
});
