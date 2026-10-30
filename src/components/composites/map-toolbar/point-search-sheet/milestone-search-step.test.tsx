import { render, screen, userEvent } from "@testing-library/react-native";

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
  test("steps the kilometer independently of the metric part", async () => {
    const onKilometerChange = jest.fn();
    const onMetricChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <MilestoneSearchStep
        {...props}
        kilometer="509"
        metric="007"
        onKilometerChange={onKilometerChange}
        onMetricChange={onMetricChange}
        selectedSection={railway.sections[0]}
      />,
    );
    await user.press(
      screen.getByRole("button", { name: "Augmenter d’un kilomètre" }),
    );
    expect(onKilometerChange).toHaveBeenLastCalledWith("510");
    await user.press(
      screen.getByRole("button", { name: "Diminuer d’un kilomètre" }),
    );
    expect(onKilometerChange).toHaveBeenLastCalledWith("508");
    expect(onMetricChange).not.toHaveBeenCalled();
  });

  test.each([
    ["499", true, false],
    ["511", false, true],
    ["", true, false],
    ["9999999999999999999999", true, true],
  ])(
    "disables unavailable steps for kilometer %s",
    async (kilometer, decreaseDisabled, increaseDisabled) => {
      await render(
        <MilestoneSearchStep
          {...props}
          kilometer={kilometer}
          selectedSection={railway.sections[0]}
        />,
      );
      expect(
        screen.getByRole("button", { name: "Diminuer d’un kilomètre" }),
      ).toHaveProp("accessibilityState", { disabled: decreaseDisabled });
      expect(
        screen.getByRole("button", { name: "Augmenter d’un kilomètre" }),
      ).toHaveProp("accessibilityState", { disabled: increaseDisabled });
    },
  );

  test("prompts for a section before selection", async () => {
    await render(<MilestoneSearchStep {...props} />);

    expect(
      screen.getByText(
        "Sélectionnez une section pour connaître les repères disponibles.",
      ),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText("Kilomètre")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Augmenter d’un kilomètre" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Diminuer d’un kilomètre" }),
    ).toBeDisabled();
  });

  test("starts empty inputs at the first recorded position", async () => {
    const onKilometerChange = jest.fn();
    const onMetricChange = jest.fn();
    const user = userEvent.setup();
    await render(
      <MilestoneSearchStep
        {...props}
        onKilometerChange={onKilometerChange}
        onMetricChange={onMetricChange}
        selectedSection={railway.sections[1]}
      />,
    );
    await user.press(
      screen.getByRole("button", { name: "Augmenter d’un kilomètre" }),
    );
    expect(onKilometerChange).toHaveBeenCalledWith("0");
    expect(onMetricChange).toHaveBeenCalledWith("005");
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
