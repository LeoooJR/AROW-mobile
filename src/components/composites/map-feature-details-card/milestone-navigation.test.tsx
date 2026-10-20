import { render, screen, userEvent } from "@testing-library/react-native";
import { useColorScheme } from "react-native";
import { Milestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import MilestoneNavigation from "./milestone-navigation";

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(() => "light"),
}));
const point = new Milestone({
  id: new MilestoneId(new RailwaySectionId("893000", 1), 509000),
  label: "509+000",
  coordinates: { latitude: 45, longitude: 4 },
});

test.each(["light", "dark"] as const)(
  "%s navigation exposes destination labels, callbacks, and updated counter",
  async (theme) => {
    jest.mocked(useColorScheme).mockReturnValue(theme);
    const onPrevious = jest.fn(),
      onNext = jest.fn(),
      user = userEvent.setup();
    const view = await render(
      <MilestoneNavigation
        neighbours={{
          previous: point,
          current: point,
          next: point,
          positionInSection: 2,
          total: 3,
        }}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );
    expect(screen.getByText("2 sur 3")).toBeOnTheScreen();
    await user.press(
      screen.getByRole("button", {
        name: "Afficher le point kilométrique précédent, 509+000",
      }),
    );
    await user.press(
      screen.getByRole("button", {
        name: "Afficher le point kilométrique suivant, 509+000",
      }),
    );
    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
    await view.rerender(
      <MilestoneNavigation
        neighbours={{
          previous: point,
          current: point,
          positionInSection: 3,
          total: 3,
        }}
      />,
    );
    expect(screen.getByText("3 sur 3")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", {
        name: "Afficher le point kilométrique suivant",
      }),
    ).toBeDisabled();
  },
);

test("loading, missing records, and singleton boundaries disable navigation; errors allow retry", async () => {
  const view = await render(<MilestoneNavigation loading />);
  expect(screen.getByText("—")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: /précédent/ })).toBeDisabled();
  expect(screen.getByRole("button", { name: /suivant/ })).toHaveStyle({
    opacity: 0.58,
  });
  await view.rerender(
    <MilestoneNavigation
      neighbours={{ current: point, positionInSection: 1, total: 1 }}
    />,
  );
  expect(screen.getByText("1 sur 1")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: /suivant/ })).toBeDisabled();
  await view.rerender(<MilestoneNavigation />);
  expect(screen.getByRole("button", { name: /précédent/ })).toBeDisabled();
  await view.rerender(<MilestoneNavigation retryable />);
  expect(screen.getByText("—")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: /précédent/ })).toBeEnabled();
  expect(screen.getByRole("button", { name: /suivant/ })).toBeEnabled();
});
