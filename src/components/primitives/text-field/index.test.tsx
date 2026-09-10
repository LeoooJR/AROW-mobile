import { render, screen, userEvent } from "@testing-library/react-native";
import { createRef } from "react";
import { TextInput } from "react-native";

import TextField from "@/components/primitives/text-field";

describe("TextField", () => {
  test("forwards text input behavior, caller classes, and its ref", async () => {
    const onChangeText = jest.fn();
    const ref = createRef<React.ComponentRef<typeof TextInput>>();
    const user = userEvent.setup();
    await render(
      <TextField
        aria-label="Recherche"
        className="self-stretch"
        onChangeText={onChangeText}
        ref={ref}
        role="searchbox"
        value=""
        variant="search"
      />,
    );

    const field = screen.getByRole("searchbox", { name: "Recherche" });
    expect(field).toHaveProp(
      "className",
      expect.stringContaining("h-12 px-3 text-base self-stretch"),
    );
    expect(Boolean(ref.current)).toBe(true);

    await user.type(field, "89");

    expect(onChangeText).toHaveBeenCalled();
  });

  test("applies the prominent numeric presentation and disabled state", async () => {
    await render(
      <TextField
        aria-label="Kilomètre"
        editable={false}
        value="509"
        variant="numeric"
      />,
    );

    const field = screen.getByLabelText("Kilomètre");
    expect(field).toHaveDisplayValue("509");
    expect(field).toHaveProp("editable", false);
    expect(field).toHaveProp("className", expect.stringContaining("h-[52px]"));
    expect(field).toHaveProp(
      "className",
      expect.stringContaining("font-mono text-[22px]"),
    );
    expect(field).toHaveStyle({ textAlign: "center" });
  });
});
