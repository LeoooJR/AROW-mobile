import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { useState } from "react";

import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  type MapLayerVisibility,
} from "@/components/adapters/map/map-layer-visibility";
import { Milestone } from "@/features/milestones/milestone";
import type {
  MilestoneSearchModel,
  MilestoneSearchState,
} from "@/features/milestones/milestone-search";
import { Railway } from "@/features/railways/railway";

import MapToolbar from "./index";

let mockSafeAreaTop = 0;
let mockWindowWidth = 412;
const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});
const milestoneSearch = {
  railways: [
    new Railway({
      code: "893000",
      name: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
      sections: [
        {
          geometry: { status: "absent" },
          milestoneRange: {
            maximumLabel: "509+000",
            maximumPositionMeters: 509_000,
            minimumLabel: "509+000",
            minimumPositionMeters: 509_000,
          },
          sectionRank: 1,
        },
      ],
    }),
  ],
  status: "ready",
} satisfies MilestoneSearchState;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

jest.mock("react-native", () => {
  const actual =
    jest.requireActual<typeof import("react-native")>("react-native");

  return new Proxy(actual, {
    get(target, property, receiver) {
      if (property === "useColorScheme") {
        return () => "light";
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
    bottom: 0,
    left: 0,
    right: 0,
    top: mockSafeAreaTop,
  }),
}));

jest.mock("@/components/adapters/native-bottom-sheet", () => {
  const { Pressable: MockPressable, View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: ({
      children,
      isOpen,
      onDismiss,
    }: React.PropsWithChildren<{
      readonly isOpen: boolean;
      readonly onDismiss: () => void;
    }>) =>
      isOpen ? (
        <MockView testID="mock-native-bottom-sheet">
          {children}
          <MockPressable
            onPress={onDismiss}
            testID="mock-native-sheet-dismiss"
          />
        </MockView>
      ) : null,
  };
});

function ControlledToolbar({
  findMilestone = async () => milestone,
  searchState = milestoneSearch,
  onMilestoneSelect = jest.fn(),
  onVisibilityChange = jest.fn(),
}: {
  readonly findMilestone?: MilestoneSearchModel["findMilestone"];
  readonly onMilestoneSelect?: jest.Mock;
  readonly onVisibilityChange?: jest.Mock;
  readonly searchState?: MilestoneSearchState;
}) {
  const [visibility, setVisibility] = useState<MapLayerVisibility>(
    DEFAULT_MAP_LAYER_VISIBILITY,
  );

  return (
    <MapToolbar
      milestoneSearch={{ findMilestone, state: searchState }}
      onMilestoneSelect={onMilestoneSelect}
      onVisibilityChange={(layer, visible) => {
        onVisibilityChange(layer, visible);
        setVisibility((current) => ({ ...current, [layer]: visible }));
      }}
      visibility={visibility}
    />
  );
}

describe("MapToolbar", () => {
  beforeEach(() => {
    mockSafeAreaTop = 0;
    mockWindowWidth = 412;
  });

  test("renders the three prototype actions", async () => {
    await render(<ControlledToolbar />);

    expect(
      screen.getByRole("button", { name: "Rechercher un point" }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", {
        name: "Afficher les couches de la carte",
      }),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("open-point-search")).toBeOnTheScreen();
    expect(screen.getByTestId("map-layers-button")).toBeOnTheScreen();
    expect(screen.getByTestId("map-focus-button")).toBeOnTheScreen();
  });

  test("opens point search while keeping focus intentionally inert", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);

    await user.press(
      screen.getByRole("button", { name: "Rechercher un point" }),
    );
    expect(screen.getByTestId("point-search-sheet")).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Rechercher un point" }),
    ).toBeExpanded();
    await user.press(
      screen.getByRole("button", { name: "Fermer la recherche" }),
    );
    await user.press(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    );

    expect(screen.getByTestId("map-toolbar")).toBeOnTheScreen();
    expect(screen.queryByRole("dialog")).not.toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Activer le mode carte seule" }),
    ).toHaveProp("aria-pressed", false);
  });

  test("centers the milestone separator in an input-height container", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);

    await user.press(screen.getByTestId("open-point-search"));

    expect(
      screen.getByTestId("milestone-input-separator", {
        includeHiddenElements: true,
      }),
    ).toHaveStyle({
      alignItems: "center",
      height: 52,
      justifyContent: "center",
    });
  });

  test("resolves and emits an exact production milestone", async () => {
    const user = userEvent.setup();
    const onMilestoneSelect = jest.fn();
    await render(<ControlledToolbar onMilestoneSelect={onMilestoneSelect} />);

    await user.press(screen.getByTestId("open-point-search"));
    const usePoint = screen.getByRole("button", { name: "Utiliser ce point" });
    expect(usePoint).toBeDisabled();
    expect(
      screen.getByText(
        "Recherchez une ligne pour afficher les correspondances.",
      ),
    ).toBeOnTheScreen();

    await user.type(
      screen.getByRole("searchbox", {
        name: "Nom de ligne ou code unique",
      }),
      "893000",
    );
    await user.press(screen.getByTestId("line-result-893000"));
    expect(screen.getByTestId("section-choice-1")).toHaveProp(
      "aria-pressed",
      true,
    );

    await user.type(screen.getByLabelText("Kilomètre"), "509");
    await user.type(screen.getByLabelText("Partie métrique"), "000");

    expect(
      await screen.findByTestId("resolved-point-summary"),
    ).toHaveTextContent(/509\+000/);
    expect(usePoint).toBeEnabled();
    await user.press(usePoint);

    expect(onMilestoneSelect).toHaveBeenCalledWith(milestone);
    expect(screen.queryByTestId("point-search-sheet")).not.toBeOnTheScreen();
  });

  test("announces and disables submission during exact lookup", async () => {
    const lookup = deferred<Milestone | undefined>();
    const user = userEvent.setup();
    await render(<ControlledToolbar findMilestone={() => lookup.promise} />);

    await user.press(screen.getByTestId("open-point-search"));
    await user.type(
      screen.getByLabelText("Nom de ligne ou code unique"),
      "893000",
    );
    await user.press(screen.getByTestId("line-result-893000"));
    await user.type(screen.getByLabelText("Kilomètre"), "509");
    await user.type(screen.getByLabelText("Partie métrique"), "000");

    expect(screen.getByRole("status")).toHaveTextContent(
      "Recherche du repère…",
    );
    expect(screen.getByTestId("search-step-milestone")).toBeBusy();
    expect(
      screen.getByRole("button", { name: "Utiliser ce point" }),
    ).toBeDisabled();

    lookup.resolve(milestone);
    expect(
      await screen.findByTestId("resolved-point-summary"),
    ).toBeOnTheScreen();
  });

  test("reports an exact lookup failure", async () => {
    const user = userEvent.setup();
    await render(
      <ControlledToolbar
        findMilestone={jest.fn().mockRejectedValue(new Error("unavailable"))}
      />,
    );

    await user.press(screen.getByTestId("open-point-search"));
    await user.type(
      screen.getByLabelText("Nom de ligne ou code unique"),
      "893000",
    );
    await user.press(screen.getByTestId("line-result-893000"));
    await user.type(screen.getByLabelText("Kilomètre"), "509");
    await user.type(screen.getByLabelText("Partie métrique"), "000");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "La recherche de ce repère est momentanément indisponible.",
    );
  });

  test("keeps search state when the native sheet is dismissed", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);
    await user.press(screen.getByTestId("open-point-search"));
    await user.type(
      screen.getByLabelText("Nom de ligne ou code unique"),
      "893000",
    );
    await fireEvent.press(
      screen.getByTestId("mock-native-sheet-dismiss", {
        includeHiddenElements: true,
      }),
    );
    await user.press(screen.getByTestId("open-point-search"));

    expect(
      screen.getByLabelText("Nom de ligne ou code unique"),
    ).toHaveDisplayValue("893000");
  });

  test("parses a complete pasted production milestone", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);
    await user.press(screen.getByTestId("open-point-search"));
    await user.type(
      screen.getByLabelText("Nom de ligne ou code unique"),
      "893000",
    );
    await user.press(screen.getByTestId("line-result-893000"));
    await user.paste(screen.getByLabelText("Kilomètre"), "PK 509+000");

    expect(screen.getByLabelText("Kilomètre")).toHaveDisplayValue("509");
    expect(screen.getByLabelText("Partie métrique")).toHaveDisplayValue("000");
    expect(
      await screen.findByTestId("resolved-point-summary"),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole("button", { name: "Utiliser ce point" }),
    ).toBeEnabled();
  });

  test("keeps point search and layers sheets mutually exclusive", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);
    await user.press(screen.getByTestId("open-point-search"));
    await user.press(screen.getByTestId("map-layers-button"));

    expect(screen.queryByTestId("point-search-sheet")).not.toBeOnTheScreen();
    expect(screen.getByTestId("map-layers-sheet")).toBeOnTheScreen();
  });

  test.each([
    ["loading", "Chargement du référentiel ferroviaire…"],
    ["error", "Référentiel ferroviaire indisponible."],
  ] as const)("announces the %s search state", async (status, message) => {
    const user = userEvent.setup();
    await render(<ControlledToolbar searchState={{ status }} />);
    await user.press(screen.getByTestId("open-point-search"));

    expect(screen.getByText(message)).toBeOnTheScreen();
  });

  test("opens and dismisses the two-option railway layer sheet", async () => {
    const user = userEvent.setup();
    await render(<ControlledToolbar />);
    const layersButton = screen.getByRole("button", {
      name: "Afficher les couches de la carte",
    });

    expect(layersButton).toBeCollapsed();
    await user.press(layersButton);

    expect(layersButton).toBeExpanded();
    expect(screen.getByTestId("map-layers-sheet")).toHaveProp("role", "dialog");
    expect(screen.getByTestId("map-layers-sheet")).toHaveAccessibleName(
      "Couches ferroviaires",
    );
    expect(screen.getByText("Voies ferrées")).toBeOnTheScreen();
    expect(screen.getByText("Points kilométriques")).toBeOnTheScreen();
    expect(screen.queryByText("Gares et haltes")).not.toBeOnTheScreen();
    expect(screen.getByTestId("map-layers-sheet")).toHaveStyle({
      paddingBottom: 20,
    });

    await user.press(
      screen.getByRole("button", { name: "Fermer les couches" }),
    );

    expect(screen.queryByTestId("map-layers-sheet")).not.toBeOnTheScreen();
    expect(layersButton).toBeCollapsed();

    await user.press(
      screen.getByRole("button", {
        name: "Afficher les couches de la carte",
      }),
    );
    await fireEvent.press(
      screen.getByTestId("mock-native-sheet-dismiss", {
        includeHiddenElements: true,
      }),
    );

    expect(screen.queryByTestId("map-layers-sheet")).not.toBeOnTheScreen();
    expect(layersButton).toBeCollapsed();
  });

  test("reports controlled visibility changes with accessible switch state", async () => {
    const user = userEvent.setup();
    const onVisibilityChange = jest.fn();
    await render(<ControlledToolbar onVisibilityChange={onVisibilityChange} />);
    await user.press(screen.getByTestId("map-layers-button"));

    const railwaySwitch = screen.getByRole("switch", {
      name: "Masquer les voies ferrées",
    });
    const milestoneSwitch = screen.getByRole("switch", {
      name: "Masquer les points kilométriques",
    });
    expect(railwaySwitch).toBeChecked();
    expect(milestoneSwitch).toBeChecked();
    expect(screen.getByTestId("railways-layer-switch")).toBeOnTheScreen();
    expect(screen.getByTestId("milestones-layer-switch")).toBeOnTheScreen();

    await user.press(railwaySwitch);
    await user.press(milestoneSwitch);

    expect(onVisibilityChange).toHaveBeenNthCalledWith(1, "railway", false);
    expect(onVisibilityChange).toHaveBeenNthCalledWith(2, "milestone", false);
    expect(
      screen.getByRole("switch", { name: "Afficher les voies ferrées" }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("switch", {
        name: "Afficher les points kilométriques",
      }),
    ).not.toBeChecked();
  });

  test("uses the larger of the prototype offset and the top safe area", async () => {
    mockSafeAreaTop = 24;

    await render(<ControlledToolbar />);

    expect(screen.getByTestId("map-toolbar")).toHaveStyle({ top: 24 });
  });

  test("adapts the prototype spacing on narrow screens", async () => {
    mockWindowWidth = 380;

    await render(<ControlledToolbar />);

    expect(screen.getByTestId("map-toolbar")).toHaveProp(
      "className",
      expect.stringContaining("inset-x-3 gap-2"),
    );
    expect(screen.getByText("Rechercher un point")).toHaveProp(
      "className",
      expect.stringContaining("text-sm"),
    );
  });
});
