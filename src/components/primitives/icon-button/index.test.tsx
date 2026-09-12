import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import IconButton from "@/components/primitives/icon-button";

describe("IconButton", () => {
  test.each([
    [undefined, "h-12", "w-12"],
    ["toolbar", "h-14", "w-14"],
  ] as const)("uses the expected square size", async (size, height, width) => {
    await render(
      <IconButton aria-label="Icon action" role="button" size={size}>
        <Text>×</Text>
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Icon action" });
    expect(button).toHaveProp("className", expect.stringContaining(height));
    expect(button).toHaveProp("className", expect.stringContaining(width));
  });

  test("preserves the caller variant and class override", async () => {
    await render(
      <IconButton
        aria-label="Surface icon"
        className="-mt-1"
        role="button"
        variant="surface"
      >
        <Text>×</Text>
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Surface icon" });
    expect(button).toHaveProp(
      "className",
      expect.stringContaining("border-border-subtle bg-canvas"),
    );
    expect(button).toHaveProp("className", expect.stringContaining("-mt-1"));
  });
});
