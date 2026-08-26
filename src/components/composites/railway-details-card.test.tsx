import { render, screen, userEvent } from "@testing-library/react-native";

import RailwayDetailsCard from "./railway-details-card";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 24, left: 0, right: 0, top: 0 }),
}));

const railway = {
  codeLigne: "340311",
  gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
  name: "Raccordement de Rouen-Martainville",
  pkDebut: "136+772",
  pkFin: "137+980",
  rangTroncon: 1,
  type: "Raccordement",
} as const;

describe("RailwayDetailsCard", () => {
  test("shows compact operational railway metadata", async () => {
    await render(<RailwayDetailsCard onClose={jest.fn()} railway={railway} />);

    expect(screen.getByText("Raccordement")).toBeOnTheScreen();
    expect(
      screen.getByText("Raccordement de Rouen-Martainville"),
    ).toBeOnTheScreen();
    expect(screen.getByText("340311")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(screen.getByText("136+772 → 137+980")).toBeOnTheScreen();
  });

  test("exposes an accessible close action", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    await render(<RailwayDetailsCard onClose={onClose} railway={railway} />);

    await user.press(
      screen.getByRole("button", {
        name: "Fermer les informations de la ligne",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
