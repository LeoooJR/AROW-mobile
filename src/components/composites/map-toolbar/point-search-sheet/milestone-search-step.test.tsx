import { render, screen } from "@testing-library/react-native";

import { Railway } from "@shared/railway-domain/railway";

import MilestoneSearchStep from "./milestone-search-step";

const railway = new Railway({
  code: "893000",
  name: "Ligne de test",
  sections: [
    {
      geometry: {
        gaiaId: "section-one",
        railwayType: "Ligne classique",
        status: "present",
      },
      milestoneRange: {
        maximumLabel: "511+000",
        maximumPositionMeters: 511_000,
        minimumLabel: "499+000",
        minimumPositionMeters: 499_000,
      },
      sectionRank: 1,
    },
    {
      geometry: {
        gaiaId: "section-two",
        railwayType: "Ligne classique",
        status: "present",
      },
      milestoneRange: {
        minimumLabel: "000+005",
        minimumPositionMeters: 5,
        maximumLabel: "009+007",
        maximumPositionMeters: 9007,
      },
      sectionRank: 2,
    },
    {
      geometry: { status: "absent" },
      milestoneRange: {
        maximumLabel: "509+000",
        maximumPositionMeters: 509_000,
        minimumLabel: "509+000",
        minimumPositionMeters: 509_000,
      },
      sectionRank: 3,
    },
  ],
});

const props = {
  kilometer: "",
  metric: "",
  onKilometerChange: jest.fn(),
  onMetricChange: jest.fn(),
  placeholderColor: "#7A7A74",
  resolution: { status: "incomplete" },
} as const;

describe("MilestoneSearchStep range hint", () => {
  test("prompts for a section before selection", async () => {
    await render(<MilestoneSearchStep {...props} />);

    expect(
      screen.getByText(
        "Sélectionnez une section pour connaître les repères disponibles.",
      ),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Kilomètre")).toBeDisabled();
  });

  test("shows recorded bounds and announces updates politely", async () => {
    await render(
      <MilestoneSearchStep {...props} selectedSection={railway.sections[0]} />,
    );

    expect(
      screen.getByText("Repères disponibles : 499+000 à 511+000."),
    ).toHaveProp("aria-live", "polite");
  });

  test("updates on section changes, preserves leading zeroes, and resets", async () => {
    const { rerender } = await render(
      <MilestoneSearchStep {...props} selectedSection={railway.sections[0]} />,
    );

    await rerender(
      <MilestoneSearchStep {...props} selectedSection={railway.sections[1]} />,
    );

    expect(
      screen.getByText("Repères disponibles : 000+005 à 009+007."),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/499\+752/)).not.toBeOnTheScreen();

    await rerender(<MilestoneSearchStep {...props} />);

    expect(
      screen.getByText(
        "Sélectionnez une section pour connaître les repères disponibles.",
      ),
    ).toBeOnTheScreen();
    expect(screen.queryByText(/000\+005/)).not.toBeOnTheScreen();
  });

  test("shows recorded bounds even without geometry", async () => {
    await render(
      <MilestoneSearchStep {...props} selectedSection={railway.sections[2]} />,
    );

    expect(
      screen.getByText("Repères disponibles : 509+000 à 509+000."),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Kilomètre")).toBeEnabled();
  });
  test("reports unavailable recorded bounds", async () => {
    const empty = new Railway({
      code: "001000",
      name: "Empty",
      sections: [{ geometry: { status: "absent" }, sectionRank: 1 }],
    });
    await render(
      <MilestoneSearchStep {...props} selectedSection={empty.sections[0]} />,
    );
    expect(
      screen.getByText("Plage de repères indisponible pour cette section."),
    ).toBeOnTheScreen();
  });
});
