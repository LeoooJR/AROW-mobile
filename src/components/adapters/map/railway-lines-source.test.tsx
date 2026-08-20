import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

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
        selectedRailway={{ codeLigne: "340311", rangTroncon: 1 }}
      />,
    );

    expect(screen.getByTestId("railway-lines-selected-layer")).toHaveProp(
      "filter",
      ["==", ["id"], "340311:1"],
    );
    expect(screen.getByTestId("railway-lines-selected-layer")).toHaveProp(
      "paint",
      expect.objectContaining({ "line-color": "#FF7A1A" }),
    );
  });

  test("emits validated railway metadata and stops press propagation", async () => {
    const onRailwayPress = jest.fn();
    const stopPropagation = jest.fn();
    await render(
      <RailwayLinesSource
        data="file:///railways.geojson"
        onRailwayPress={onRailwayPress}
      />,
    );

    await fireEvent(screen.getByTestId("railway-lines-source"), "press", {
      nativeEvent: { features: [railwayFeature] },
      stopPropagation,
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onRailwayPress).toHaveBeenCalledWith({
      codeLigne: "340311",
      gaiaId: "4718490e-6665-11e3-afff-01f464e0362d",
      name: "Raccordement de Rouen-Martainville",
      pkDebut: "136+772",
      pkFin: "137+980",
      rangTroncon: 1,
      type: "Raccordement",
    });
  });

  test("ignores malformed or incorrectly identified features", async () => {
    const onRailwayPress = jest.fn();
    const stopPropagation = jest.fn();
    await render(
      <RailwayLinesSource
        data="file:///railways.geojson"
        onRailwayPress={onRailwayPress}
      />,
    );

    await fireEvent(screen.getByTestId("railway-lines-source"), "press", {
      nativeEvent: {
        features: [{ ...railwayFeature, id: "wrong-id" }],
      },
      stopPropagation,
    });

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(onRailwayPress).not.toHaveBeenCalled();
  });
});
