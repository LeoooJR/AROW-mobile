import { render, screen, userEvent } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/milestone";
import { Railway } from "@/features/railways/railway";

import MapFeatureDetailsCard from "./index";

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 24, left: 0, right: 0, top: 0 }),
}));

const railwayLine = new Railway({
  code: "340311",
  name: "Raccordement de Rouen-Martainville",
  sections: [
    {
      geometry: {
        endMilestone: "137+980",
        gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
        railwayType: "Raccordement",
        startMilestone: "136+772",
        status: "present",
      },
      sectionRank: 1,
    },
  ],
});
const railway = railwayLine.sections[0];

const milestone = new Milestone({
  coordinates: { latitude: 45.74491, longitude: 4.86234 },
  label: "241+000",
  lineCode: "001000",
  positionMeters: 241_000,
  sectionRank: 1,
});

describe("MapFeatureDetailsCard", () => {
  test("shows compact operational railway metadata", async () => {
    await render(
      <MapFeatureDetailsCard feature={railway} onClose={jest.fn()} />,
    );

    expect(screen.getByText("Raccordement")).toBeOnTheScreen();
    expect(
      screen.getByText("Raccordement de Rouen-Martainville"),
    ).toBeOnTheScreen();
    expect(screen.getByText("340311")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(screen.getByText("136+772 → 137+980")).toBeOnTheScreen();
    expect(screen.queryByText("Coordonnées")).not.toBeOnTheScreen();
  });

  test("shows a milestone with its parent section and coordinates", async () => {
    await render(
      <MapFeatureDetailsCard feature={milestone} onClose={jest.fn()} />,
    );

    expect(screen.getByText("Point kilométrique")).toBeOnTheScreen();
    expect(screen.getByText("PK 241+000")).toBeOnTheScreen();
    expect(screen.getByText("001000")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
    expect(screen.getByText("241+000")).toBeOnTheScreen();
    expect(screen.getByText("45.74491 N · 4.86234 E")).toBeOnTheScreen();
  });

  test("formats coordinates in the southern and western hemispheres", async () => {
    await render(
      <MapFeatureDetailsCard
        feature={
          new Milestone({
            coordinates: { latitude: -12.5, longitude: -3.25 },
            label: milestone.label,
            lineCode: milestone.lineCode,
            positionMeters: milestone.positionMeters,
            sectionRank: milestone.sectionRank,
          })
        }
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText("12.50000 S · 3.25000 W")).toBeOnTheScreen();
  });

  test("exposes an accessible close action", async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    await render(<MapFeatureDetailsCard feature={railway} onClose={onClose} />);

    await user.press(
      screen.getByRole("button", {
        name: "Fermer les informations de l’élément cartographique",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("moves above an expanded simulation control bar", async () => {
    const { rerender } = await render(
      <MapFeatureDetailsCard feature={milestone} onClose={jest.fn()} />,
    );

    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 110,
    });

    await rerender(
      <MapFeatureDetailsCard
        feature={milestone}
        onClose={jest.fn()}
        showSimulationAction
      />,
    );

    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 177,
    });
  });
});
