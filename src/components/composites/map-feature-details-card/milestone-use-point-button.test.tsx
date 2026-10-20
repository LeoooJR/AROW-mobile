import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { useColorScheme } from "react-native";
import { Milestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import MilestoneDetailsCard from "./milestone-details-card";

jest.mock("react-native/Libraries/Utilities/useColorScheme", () => ({
  default: jest.fn(() => "light"),
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));
const milestone = new Milestone({
  id: new MilestoneId(new RailwaySectionId("893000", 1), 509000),
  label: "509+000",
  coordinates: { latitude: 45, longitude: 4 },
});

test.each(["light", "dark"] as const)(
  "%s action selects the displayed point and exposes focus feedback",
  async (theme) => {
    jest.mocked(useColorScheme).mockReturnValue(theme);
    const usePoint = jest.fn(),
      close = jest.fn(),
      user = userEvent.setup();
    await render(
      <MilestoneDetailsCard
        feature={milestone}
        onClose={close}
        onUsePoint={usePoint}
        usePointDisabled={false}
      />,
    );
    const button = screen.getByRole("button", { name: "Utiliser ce point" });
    expect(button).toHaveProp(
      "accessibilityHint",
      "Sélectionne ce repère pour préparer la simulation.",
    );
    expect(screen.getByText("Utiliser ce point")).toHaveStyle({
      color: theme === "dark" ? "#0A0A0A" : "#FFFFFF",
    });
    await fireEvent(button, "focus");
    expect(button).toHaveStyle({
      outlineWidth: 3,
      outlineOffset: 2,
      outlineColor: theme === "dark" ? "#FFFFFF" : "#0A0A0A",
    });
    await fireEvent(button, "blur");
    expect(button).toHaveStyle({ outlineWidth: 0 });
    await user.press(button);
    expect(usePoint).toHaveBeenCalledWith(milestone);
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByText("PK 509+000")).toBeOnTheScreen();
  },
);

test("simulation policy disables the action, independently of neighbour loading and failures", async () => {
  const usePoint = jest.fn(),
    user = userEvent.setup();
  const view = await render(
    <MilestoneDetailsCard
      feature={milestone}
      onClose={jest.fn()}
      onUsePoint={usePoint}
      usePointDisabled
      loading
    />,
  );
  expect(
    screen.getByRole("button", { name: "Utiliser ce point" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Utiliser ce point" })).toHaveStyle(
    { opacity: 0.58 },
  );
  await user.press(screen.getByRole("button", { name: "Utiliser ce point" }));
  expect(usePoint).not.toHaveBeenCalled();
  await view.rerender(
    <MilestoneDetailsCard
      feature={milestone}
      onClose={jest.fn()}
      onUsePoint={usePoint}
      usePointDisabled={false}
      loading
    />,
  );
  await user.press(screen.getByRole("button", { name: "Utiliser ce point" }));
  await view.rerender(
    <MilestoneDetailsCard
      feature={milestone}
      onClose={jest.fn()}
      onUsePoint={usePoint}
      usePointDisabled={false}
      retryable
    />,
  );
  await user.press(screen.getByRole("button", { name: "Utiliser ce point" }));
  expect(usePoint.mock.calls).toEqual([[milestone], [milestone]]);
});
