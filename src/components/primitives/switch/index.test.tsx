import { render, screen, userEvent } from "@testing-library/react-native";

import Switch from "@/components/primitives/switch";

describe("Switch", () => {
  test("exposes checked state and requests the inverse value", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <Switch
        accessibilityLabel="Masquer la couche"
        checked
        onValueChange={onValueChange}
      />,
    );

    const control = screen.getByRole("switch", {
      name: "Masquer la couche",
    });
    expect(control).toBeChecked();

    await user.press(control);

    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  test("supports unchecked, disabled, and caller-class states", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <Switch
        accessibilityLabel="Afficher la couche"
        checked={false}
        className="opacity-50"
        disabled
        onValueChange={onValueChange}
      />,
    );

    const control = screen.getByRole("switch", {
      name: "Afficher la couche",
    });
    expect(control).not.toBeChecked();
    expect(control).toBeDisabled();
    expect(control).toHaveProp(
      "className",
      expect.stringContaining("opacity-50"),
    );

    await user.press(control);

    expect(onValueChange).not.toHaveBeenCalled();
  });
});
