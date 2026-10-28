import { render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";

import { MAP_LAYER_IDS } from "./layer-ids";
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
        selectedSection={new RailwaySectionId("340311", 1)}
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
        selectedSection={new RailwaySectionId("340311", 1)}
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

  test("leaves feature presses to the map", async () => {
    await render(<RailwayLinesSource data="file:///railways.geojson" />);
    expect(screen.getByTestId("railway-lines-source")).not.toHaveProp(
      "onPress",
    );
  });
});
