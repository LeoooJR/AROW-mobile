import { render, screen } from "@testing-library/react-native";

import Map from "./map.web";

describe("Map web fallback", () => {
  test("explains that the interactive map requires a native platform", async () => {
    await render(<Map />);

    expect(
      screen.getByTestId("arow-map-web-fallback"),
    ).toHaveAccessibilityValue({});
    expect(
      screen.getByLabelText("Carte ferroviaire AROW indisponible sur le web"),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        "La carte interactive est disponible sur Android et iOS.",
      ),
    ).toBeOnTheScreen();
  });
});
