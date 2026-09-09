import {
  milestoneLookupErrorResolution,
  outOfRangeMilestoneResolution,
  unavailableMilestoneResolution,
} from "./milestone-search-messages";

describe("milestone search messages", () => {
  test("formats section bounds", () => {
    expect(
      outOfRangeMilestoneResolution({
        maximumLabel: "509+000",
        maximumPositionMeters: 509_000,
        minimumLabel: "499+000",
        minimumPositionMeters: 499_000,
      }),
    ).toEqual({
      message:
        "Repère hors section. Saisissez une valeur entre 499+000 et 509+000.",
      status: "error",
    });
  });

  test("formats unavailable and lookup failure errors", () => {
    expect(unavailableMilestoneResolution("508", "500")).toEqual({
      message: "Le repère 508+500 n’est pas disponible dans cette section.",
      status: "error",
    });
    expect(milestoneLookupErrorResolution()).toEqual({
      message: "La recherche de ce repère est momentanément indisponible.",
      status: "error",
    });
  });
});
