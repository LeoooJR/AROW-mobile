import { fireEvent, render, screen } from "@testing-library/react-native";

import type {
  MockedLocationState,
  RealLocationState,
} from "@/hooks/platform/use-real-location";

import LocationBar from "./location-bar";

let mockSafeAreaBottom = 0;
let mockColorScheme: "dark" | "light" | null = "light";
let mockWindowWidth = 412;

jest.mock("react-native", () => {
  const actual =
    jest.requireActual<typeof import("react-native")>("react-native");

  return new Proxy(actual, {
    get(target, property, receiver) {
      if (property === "useColorScheme") {
        return () => mockColorScheme;
      }

      if (property === "useWindowDimensions") {
        return () => ({
          fontScale: 1,
          height: 800,
          scale: 1,
          width: mockWindowWidth,
        });
      }

      return Reflect.get(target, property, receiver);
    },
  });
});

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({
    bottom: mockSafeAreaBottom,
    left: 0,
    right: 0,
    top: 0,
  }),
}));

interface StateExpectation {
  readonly detail: string;
  readonly label: string;
  readonly state: RealLocationState | MockedLocationState;
}

const stateExpectations: readonly StateExpectation[] = [
  {
    detail: "Accès à la position…",
    label: "Position réelle, vérification en cours",
    state: { status: "checking" },
  },
  {
    detail: "Touchez pour activer la position",
    label:
      "Position réelle, autorisation requise. Touchez pour activer la position.",
    state: { status: "permissionRequired" },
  },
  {
    detail: "Validation de l’accès…",
    label: "Position réelle, autorisation en cours",
    state: { status: "requesting" },
  },
  {
    detail: "Recherche de la position…",
    label: "Position réelle, recherche en cours",
    state: { status: "locating" },
  },
  {
    detail: "Touchez pour réessayer",
    label:
      "Position réelle, services de localisation désactivés. Touchez pour réessayer.",
    state: { status: "servicesDisabled" },
  },
  {
    detail: "Touchez pour autoriser",
    label: "Position réelle, accès refusé. Touchez pour autoriser.",
    state: { canAskAgain: true, status: "denied" },
  },
  {
    detail: "Touchez pour ouvrir les réglages",
    label: "Position réelle, accès bloqué. Touchez pour ouvrir les réglages.",
    state: { canAskAgain: false, status: "denied" },
  },
  {
    detail: "Touchez pour réessayer",
    label: "Position réelle indisponible. Touchez pour réessayer.",
    state: { status: "error" },
  },
];

describe("LocationBar", () => {
  beforeEach(() => {
    mockColorScheme = "light";
    mockSafeAreaBottom = 0;
    mockWindowWidth = 412;
  });

  test.each(stateExpectations)(
    "renders the $state.status presentation",
    async ({ detail, label, state }) => {
      await render(<LocationBar state={state} />);

      expect(screen.getByLabelText(label)).toBeOnTheScreen();
      expect(screen.getByText(detail)).toBeOnTheScreen();
      expect(screen.queryByTestId("center-location")).toBeNull();
    },
  );

  test("formats a connected real position and rounds its accuracy", async () => {
    await render(
      <LocationBar
        state={{
          position: {
            accuracy: 4.6,
            heading: null,
            latitude: -48.8566,
            longitude: -2.3522,
          },
          status: "connected",
        }}
      />,
    );

    expect(screen.getByText("Position réelle")).toBeOnTheScreen();
    expect(screen.getByText("Connectée")).toBeOnTheScreen();
    expect(
      screen.getByText("48.85660 S · 2.35220 O · précision 5 m"),
    ).toBeOnTheScreen();
  });

  test("formats mocked coordinates and unavailable accuracy", async () => {
    await render(
      <LocationBar
        state={{
          position: {
            accuracy: null,
            heading: 0,
            latitude: 0,
            longitude: 1.25,
          },
          status: "mocked",
        }}
      />,
    );

    expect(screen.getByText("Position simulée")).toBeOnTheScreen();
    expect(screen.getByText("Active")).toBeOnTheScreen();
    expect(
      screen.getByText("0.00000 N · 1.25000 E · précision indisponible"),
    ).toBeOnTheScreen();
  });

  test("clamps a negative reported accuracy to zero", async () => {
    await render(
      <LocationBar
        state={{
          position: {
            accuracy: -3,
            heading: null,
            latitude: 1,
            longitude: 2,
          },
          status: "connected",
        }}
      />,
    );

    expect(
      screen.getByText("1.00000 N · 2.00000 E · précision 0 m"),
    ).toBeOnTheScreen();
  });

  test("invokes an available row action", async () => {
    const onAction = jest.fn();
    await render(
      <LocationBar
        onAction={onAction}
        state={{ status: "permissionRequired" }}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", {
        name: /autorisation requise/i,
      }),
    );

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test.each([
    ["connected", "réelle"],
    ["mocked", "simulée"],
  ] as const)("centers a %s position", async (status, locationKind) => {
    const onCenter = jest.fn();
    await render(
      <LocationBar
        onCenter={onCenter}
        state={{
          position: {
            accuracy: 3,
            heading: 90,
            latitude: 48,
            longitude: 2,
          },
          status,
        }}
      />,
    );

    await fireEvent.press(
      screen.getByRole("button", {
        name: `Centrer la carte sur la position ${locationKind}`,
      }),
    );

    expect(onCenter).toHaveBeenCalledTimes(1);
  });

  test("uses a compact center button on narrow screens", async () => {
    mockColorScheme = "dark";
    mockWindowWidth = 380;

    await render(
      <LocationBar
        onCenter={jest.fn()}
        state={{
          position: {
            accuracy: 1,
            heading: null,
            latitude: 1,
            longitude: 2,
          },
          status: "connected",
        }}
      />,
    );

    expect(screen.getByTestId("center-location")).toBeOnTheScreen();
    expect(screen.queryByText("Centrer")).toBeNull();
  });

  test("respects a larger bottom safe-area inset", async () => {
    mockSafeAreaBottom = 24;

    await render(<LocationBar state={{ status: "checking" }} />);

    expect(
      screen.getByLabelText("Position réelle, vérification en cours").parent
        ?.parent,
    ).toHaveStyle({ paddingBottom: 24 });
  });
});
