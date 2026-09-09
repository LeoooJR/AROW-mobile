import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { RailwaySectionKey } from "@/features/map-features/railway-section-key";
import { RailwaySection } from "@/features/railways/railway-section";

import { MAP_LAYER_IDS } from "./map-layer-ids";
import RailwayLinesSource from "./railway-lines-source";

jest.mock("@maplibre/maplibre-react-native", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    GeoJSONSource: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <MockView {...props}>{children}</MockView>
    ),
    Layer: (props: Record<string, unknown>) => <MockView {...props} />,
  };
});

const railwayFeature = {
  geometry: {
    coordinates: [
      [1.12, 49.43],
      [1.1, 49.44],
    ],
    type: "LineString",
  },
  id: "340311:1",
  properties: {
    code_ligne: "340311",
    idgaia: "4718490e-6665-11e3-afff-01f464e0362d",
    lib_ligne: "Raccordement de Rouen-Martainville",
    pkd: "136+772",
    pkf: "137+980",
    rg_troncon: 1,
    type_ligne: "Raccordement",
  },
  type: "Feature",
} as const;

describe("RailwayLinesSource", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders a subtle light-theme line layer from regional zoom", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    await render(<RailwayLinesSource data="file:///railways.geojson" />);

    expect(screen.getByTestId("railway-lines-source")).toHaveProp(
      "data",
      "file:///railways.geojson",
    );
    expect(screen.getByTestId("railway-lines-passive-layer")).toHaveProp(
      "minzoom",
      7,
    );
    expect(screen.getByTestId("railway-lines-passive-layer")).toHaveProp(
      "beforeId",
      MAP_LAYER_IDS.milestone.dots,
    );
    expect(screen.getByTestId("railway-lines-passive-layer")).toHaveProp(
      "paint",
      expect.objectContaining({
        "line-color": "#0A0A0A",
        "line-opacity": 0.22,
      }),
    );
    expect(screen.queryByTestId("railway-lines-selected-layer")).toBeNull();
  });

  test("filters the orange selected layer by the composite feature ID", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

    await render(
      <RailwayLinesSource
        data="file:///railways.geojson"
        selectedSection={new RailwaySectionKey("340311", 1)}
      />,
    );

    expect(screen.getByTestId("railway-lines-selected-layer")).toHaveProp(
      "filter",
      ["==", ["id"], "340311:1"],
    );
    expect(screen.getByTestId("railway-lines-selected-layer")).toHaveProp(
      "beforeId",
      MAP_LAYER_IDS.milestone.dots,
    );
    expect(screen.getByTestId("railway-lines-selected-layer")).toHaveProp(
      "paint",
      expect.objectContaining({ "line-color": "#FF7A1A" }),
    );
  });

  test("keeps layers mounted but hides and disables the source", async () => {
    await render(
      <RailwayLinesSource
        data="file:///railways.geojson"
        onFeaturePress={jest.fn()}
        selectedSection={new RailwaySectionKey("340311", 1)}
        visible={false}
      />,
    );

    expect(screen.getByTestId("railway-lines-source")).not.toHaveProp(
      "onPress",
    );
    expect(screen.getByTestId("railway-lines-passive-layer")).toHaveProp(
      "layout",
      expect.objectContaining({ visibility: "none" }),
    );
    expect(screen.getByTestId("railway-lines-selected-layer")).toHaveProp(
      "layout",
      expect.objectContaining({ visibility: "none" }),
    );
    expect(screen.getByTestId("railway-lines-passive-layer")).toHaveProp(
      "beforeId",
      MAP_LAYER_IDS.milestone.dots,
    );
  });

  test("emits validated railway metadata and stops press propagation", async () => {
    const onFeaturePress = jest.fn();
    const stopPropagation = jest.fn();
    await render(
      <RailwayLinesSource
        data="file:///railways.geojson"
        onFeaturePress={onFeaturePress}
      />,
    );

    await fireEvent(screen.getByTestId("railway-lines-source"), "press", {
      nativeEvent: { features: [railwayFeature] },
      stopPropagation,
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onFeaturePress).toHaveBeenCalledWith(expect.any(RailwaySection));
    const pressedRailway = onFeaturePress.mock.calls[0]?.[0];
    expect(pressedRailway?.id).toBe("340311:1");
    expect(pressedRailway?.name).toBe("Raccordement de Rouen-Martainville");
    expect(pressedRailway?.geometry).toMatchObject({
      railwayType: "Raccordement",
      status: "present",
    });
  });

  test("ignores malformed or incorrectly identified features", async () => {
    const onFeaturePress = jest.fn();
    const stopPropagation = jest.fn();
    await render(
      <RailwayLinesSource
        data="file:///railways.geojson"
        onFeaturePress={onFeaturePress}
      />,
    );

    await fireEvent(screen.getByTestId("railway-lines-source"), "press", {
      nativeEvent: {
        features: [{ ...railwayFeature, id: "wrong-id" }],
      },
      stopPropagation,
    });

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(onFeaturePress).not.toHaveBeenCalled();
  });
});
