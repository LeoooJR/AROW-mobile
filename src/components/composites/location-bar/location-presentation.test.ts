import getLocationPresentation from "./location-presentation";

test.each([
  ["LOCATION_SERVICES_DISABLED", "Activez les services de localisation"],
  ["LOCATION_PERMISSION_REQUIRED", "Autorisez l’accès à la position"],
  [
    "MOCK_PROVIDER_NOT_SELECTED",
    "Options développeur : sélectionnez AROW comme application de position fictive.",
  ],
  [
    "READINESS_CHECK_FAILED",
    "Vérification de la localisation impossible. Réessayez",
  ],
])("a clean runtime stop explains %s", (code, remedy) => {
  expect(
    getLocationPresentation(
      { status: "checking" },
      {
        status: "error",
        origin: "reconciliation",
        code,
        mayBeActive: false,
      },
    ),
  ).toMatchObject({
    kindLabel: "Simulation arrêtée",
    stateLabel: "À redémarrer",
    detail: remedy,
    accessibilityLabel: `Simulation arrêtée. ${remedy}`,
  });
});

test.each([false, true])(
  "cleanup failure never claims stopped (ownership %s)",
  (mayBeActive) => {
    expect(
      getLocationPresentation(
        { status: "checking" },
        {
          status: "error",
          origin: "reconciliation",
          code: "CLEANUP_FAILED",
          mayBeActive,
        },
      ),
    ).toMatchObject({
      kindLabel: "Position simulée",
      stateLabel: "Erreur",
      detail: "Arrêt incomplet. Réessayez",
    });
  },
);

test("a failed explicit start keeps its existing feedback", () => {
  expect(
    getLocationPresentation(
      { status: "checking" },
      {
        status: "error",
        origin: "start",
        code: "LOCATION_SERVICES_DISABLED",
        mayBeActive: false,
      },
    ).kindLabel,
  ).toBe("Position simulée");
});

test.each(["start", "cleanup", "reconciliation"] as const)(
  "mock selection loss with retained ownership explains incomplete cleanup (%s)",
  (origin) => {
    const presentation = getLocationPresentation(
      { status: "checking" },
      {
        status: "error",
        origin,
        code: "MOCK_PROVIDER_NOT_SELECTED",
        mayBeActive: true,
      },
    );
    expect(presentation).toMatchObject({
      kindLabel: "Position simulée",
      stateLabel: "Erreur",
      dotClassName: "bg-error",
      detail:
        "Sélectionnez AROW comme application de position fictive dans les options développeur, puis réessayez l’arrêt.",
    });
    expect(presentation.accessibilityLabel).toContain(presentation.detail);
    expect(presentation.accessibilityLabel).not.toContain("Simulation arrêtée");
  },
);
