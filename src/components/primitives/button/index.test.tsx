import { render, screen, userEvent } from "@testing-library/react-native";
import { createRef } from "react";
import { Pressable, Text } from "react-native";

import Button from "@/components/primitives/button";

describe("Button", () => {
  test.each([
    ["surface", "border-border-subtle bg-canvas active:bg-surface-muted"],
    ["ghost", "bg-transparent active:bg-surface-muted"],
    ["foreground", "bg-text-primary active:bg-surface-muted"],
    ["accent", "border-text-primary bg-primary active:bg-text-primary"],
    ["selectable", "border-border-subtle bg-surface active:bg-surface-muted"],
  ] as const)("applies the %s visual variant", async (variant, classes) => {
    await render(
      <Button aria-label={variant} role="button" variant={variant}>
        <Text>{variant}</Text>
      </Button>,
    );

    expect(screen.getByRole("button", { name: variant })).toHaveProp(
      "className",
      expect.stringContaining(classes),
    );
  });

  test.each([
    ["control", "h-12"],
    ["form", "h-[52px]"],
    ["toolbar", "h-14"],
  ] as const)("applies the %s size", async (size, heightClass) => {
    await render(
      <Button aria-label={size} role="button" size={size}>
        <Text>{size}</Text>
      </Button>,
    );

    expect(screen.getByRole("button", { name: size })).toHaveProp(
      "className",
      expect.stringContaining(heightClass),
    );
  });

  test("forwards interaction props, caller classes, and its ref", async () => {
    const onPress = jest.fn();
    const ref = createRef<React.ComponentRef<typeof Pressable>>();
    const user = userEvent.setup();

    await render(
      <Button
        aria-label="Action"
        className="self-stretch rounded-none"
        onPress={onPress}
        ref={ref}
        role="button"
      >
        <Text>Action</Text>
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Action" });
    expect(button).toHaveProp(
      "className",
      expect.stringContaining("self-stretch rounded-none"),
    );
    expect(Boolean(ref.current)).toBe(true);

    await user.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test("preserves the disabled pressable state", async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await render(
      <Button
        aria-label="Disabled action"
        disabled
        onPress={onPress}
        role="button"
      >
        <Text>Disabled action</Text>
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Disabled action" });
    expect(button).toBeDisabled();

    await user.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
