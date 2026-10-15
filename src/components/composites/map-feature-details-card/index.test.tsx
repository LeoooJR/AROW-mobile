import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { render, screen, userEvent } from "@testing-library/react-native";

import { Milestone } from "@shared/railway-domain/milestone";
import { Railway } from "@shared/railway-domain/railway";

import RailwayDetailsCard from "./railway-details-card";
import MilestoneDetailsCard from "./milestone-details-card";

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
  id: new MilestoneId(new RailwaySectionId("001000", 1), 241_000),
  coordinates: { latitude: 45.74491, longitude: 4.86234 },
  label: "241+000",
});

describe("MapFeatureDetailsCard", () => {
  test("exposes enabled endpoint labels and independent callbacks", async () => {
    const first = jest.fn(),
      last = jest.fn();
    const user = userEvent.setup();
    await render(
      <RailwayDetailsCard
        feature={railway}
        onClose={jest.fn()}
        onFirst={first}
        onLast={last}
        bounds={{ first: milestone, last: milestone }}
      />,
    );
    await user.press(
      screen.getByRole("button", {
        name: "Centrer la carte sur le premier repère, 241+000",
      }),
    );
    await user.press(
      screen.getByRole("button", {
        name: "Centrer la carte sur le dernier repère, 241+000",
      }),
    );
    expect(first).toHaveBeenCalledTimes(1);
    expect(last).toHaveBeenCalledTimes(1);
  });
  test("disables missing and loading endpoints but enables error recovery", async () => {
    const props = {
      feature: railway,
      onClose: jest.fn(),
      onFirst: jest.fn(),
      onLast: jest.fn(),
    };
    const { rerender } = await render(<RailwayDetailsCard {...props} />);
    expect(screen.getByTestId("first-railway-milestone")).toBeDisabled();
    expect(screen.getByTestId("last-railway-milestone")).toBeDisabled();
    await rerender(<RailwayDetailsCard {...props} retryable />);
    expect(screen.getByTestId("first-railway-milestone")).toBeEnabled();
    await rerender(<RailwayDetailsCard {...props} retryable loading />);
    expect(screen.getByTestId("first-railway-milestone")).toBeDisabled();
  });
  test("shows compact operational railway metadata", async () => {
    await render(
      <RailwayDetailsCard
        feature={railway}
        onClose={jest.fn()}
        onFirst={jest.fn()}
        onLast={jest.fn()}
      />,
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
      <MilestoneDetailsCard feature={milestone} onClose={jest.fn()} />,
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
      <MilestoneDetailsCard
        feature={
          new Milestone({
            id: new MilestoneId(
              new RailwaySectionId(milestone.lineCode, milestone.sectionRank),
              milestone.positionMeters,
            ),
            coordinates: { latitude: -12.5, longitude: -3.25 },
            label: milestone.label,
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
    await render(
      <RailwayDetailsCard
        feature={railway}
        onClose={onClose}
        onFirst={jest.fn()}
        onLast={jest.fn()}
      />,
    );

    await user.press(
      screen.getByRole("button", {
        name: "Fermer les informations de l’élément cartographique",
      }),
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("moves above an expanded simulation control bar", async () => {
    const { rerender } = await render(
      <MilestoneDetailsCard feature={milestone} onClose={jest.fn()} />,
    );

    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 110,
    });

    await rerender(
      <MilestoneDetailsCard
        feature={milestone}
        onClose={jest.fn()}
        showSimulationAction
      />,
    );

    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 177,
    });

    await rerender(
      <MilestoneDetailsCard
        feature={milestone}
        onClose={jest.fn()}
        bottomOffset={240}
      />,
    );
    expect(screen.getByTestId("map-feature-details-card")).toHaveStyle({
      bottom: 240,
    });
  });
});
