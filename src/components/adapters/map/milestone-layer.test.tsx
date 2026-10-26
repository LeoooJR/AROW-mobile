import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";
import {
  featureFilter,
  type FilterSpecification,
} from "@maplibre/maplibre-gl-style-spec";

import { Milestone } from "@shared/railway-domain/milestone";

import { MAP_LAYER_IDS } from "./layer-ids";
import MilestoneLayer from "./milestone-layer";

jest.mock("@maplibre/maplibre-react-native", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    GeoJSONSource: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <MockView {...props} testID="mock-milestone-source">
        {children}
      </MockView>
    ),
    Layer: ({ id, ...props }: Record<string, unknown>) => (
      <MockView {...props} testID={`mock-${id}`} />
    ),
  };
});

const MILESTONE = new Milestone({
  id: new MilestoneId(new RailwaySectionId("001000", 1), 241_000),
  coordinates: { latitude: 45.74, longitude: 4.86 },
  label: "241+000",
});

const FEATURE = {
  geometry: { coordinates: [4.86, 45.74], type: "Point" },
  id: "001000:1:241000",
  properties: {
    label: "241+000",
    lineCode: "001000",
    positionMeters: 241_000,
    sectionRank: 1,
  },
  type: "Feature",
} as const;

describe("MilestoneLayer", () => {
  afterEach(() => jest.restoreAllMocks());

  test("passes the generated asset URI directly to MapLibre", async () => {
    await render(<MilestoneLayer data="file:///milestones.geojson" />);

    expect(screen.getByTestId("mock-milestone-source")).toHaveProp(
      "data",
      "file:///milestones.geojson",
    );
    expect(
      screen.getByTestId(`mock-${MAP_LAYER_IDS.milestone.dots}`),
    ).toHaveProp("minzoom", 10);
    expect(
      screen.getByTestId(`mock-${MAP_LAYER_IDS.milestone.labels}`),
    ).toHaveProp("minzoom", 13);
  });

  test("renders viewport points with exact identities and coordinates without duplicating a selected point", async () => {
    const view = await render(
      <MilestoneLayer data={[]} selectedMilestone={MILESTONE} />,
    );
    expect(screen.getByTestId("mock-milestone-source")).toHaveProp("data", {
      type: "FeatureCollection",
      features: [FEATURE],
    });
    await view.rerender(
      <MilestoneLayer data={[MILESTONE]} selectedMilestone={MILESTONE} />,
    );
    expect(screen.getByTestId("mock-milestone-source")).toHaveProp("data", {
      type: "FeatureCollection",
      features: [FEATURE],
    });
  });

  test("keeps an empty source mounted until the asset URI is ready", async () => {
    const view = await render(<MilestoneLayer />);

    expect(screen.getByTestId("mock-milestone-source")).toHaveProp("data", {
      features: [],
      type: "FeatureCollection",
    });

    await view.rerender(<MilestoneLayer data="file:///milestones.geojson" />);
    expect(screen.getByTestId("mock-milestone-source")).toHaveProp(
      "data",
      "file:///milestones.geojson",
    );
  });

  test("leaves feature presses to the map", async () => {
    await render(<MilestoneLayer data={[MILESTONE]} />);
    expect(screen.getByTestId("mock-milestone-source")).not.toHaveProp(
      "onPress",
    );
  });

  test("highlights the selected milestone", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");
    await render(<MilestoneLayer selectedMilestone={MILESTONE} />);

    expect(
      screen.getByTestId(`mock-${MAP_LAYER_IDS.milestone.selected}`),
    ).toHaveProp("filter", ["==", ["id"], "001000:1:241000"]);
  });

  test("keeps the ordering anchor mounted while layers are hidden", async () => {
    await render(
      <MilestoneLayer selectedMilestone={MILESTONE} visible={false} />,
    );

    expect(screen.getByTestId("mock-milestone-source")).not.toHaveProp(
      "onPress",
    );
    for (const layerId of [
      MAP_LAYER_IDS.milestone.dots,
      MAP_LAYER_IDS.milestone.selected,
      MAP_LAYER_IDS.milestone.labels,
    ]) {
      expect(screen.getByTestId(`mock-${layerId}`)).toHaveProp(
        "layout",
        expect.objectContaining({ visibility: "none" }),
      );
    }
  });

  test.each([
    [9.999, []],
    [10, [0, 1000]],
    [11.999, [0, 1000]],
    [12, [0, 500, 1000]],
    [13.999, [0, 500, 1000]],
    [14, [0, 100, 500, 1000]],
    [14.999, [0, 100, 500, 1000]],
    [15, [0, 1, 100, 500, 772, 1000]],
  ])("filters already-loaded dots at zoom %s", async (zoom, expected) => {
    await render(<MilestoneLayer />);
    const layers = screen.getAllByTestId(/^mock-railway-milestone-dots/);
    const displayed = [0, 1, 100, 500, 772, 1000].filter((position) =>
      layers.some(
        (layer) =>
          zoom >= layer.props.minzoom &&
          zoom < (layer.props.maxzoom ?? Infinity) &&
          featureFilter(layer.props.filter as FilterSpecification).filter(
            { zoom },
            { type: "Point", properties: { positionMeters: position } },
          ),
      ),
    );
    expect(displayed).toEqual(expected);
    expect(
      layers.filter(
        (layer) =>
          zoom >= layer.props.minzoom &&
          zoom < (layer.props.maxzoom ?? Infinity),
      ),
    ).toHaveLength(zoom < 10 ? 0 : 1);
  });

  test("retains only the selected irregular point and removes its label exception on close", async () => {
    const irregular = new Milestone({
      id: new MilestoneId(MILESTONE.id.sectionId, 136_772),
      label: "136+772",
      coordinates: MILESTONE.coordinates,
    });
    const view = await render(
      <MilestoneLayer data={[]} selectedMilestone={irregular} />,
    );
    const label = () =>
      screen.getByTestId(`mock-${MAP_LAYER_IDS.milestone.labels}`);
    const selectedFilter = featureFilter(
      label().props.filter as FilterSpecification,
    );
    expect(
      selectedFilter.filter(
        { zoom: 13 },
        {
          id: irregular.id.value,
          type: "Point",
          properties: { positionMeters: 136_772 },
        },
      ),
    ).toBe(true);
    expect(
      selectedFilter.filter(
        { zoom: 13 },
        { id: "other", type: "Point", properties: { positionMeters: 136_772 } },
      ),
    ).toBe(false);
    expect(
      screen.getByTestId(`mock-${MAP_LAYER_IDS.milestone.selected}`),
    ).toHaveProp("minzoom", 10);
    await view.rerender(<MilestoneLayer data={[]} />);
    expect(
      screen.queryByTestId(`mock-${MAP_LAYER_IDS.milestone.selected}`),
    ).not.toBeOnTheScreen();
    expect(screen.getByTestId("mock-milestone-source")).toHaveProp("data", {
      type: "FeatureCollection",
      features: [],
    });
    expect(
      featureFilter(label().props.filter as FilterSpecification).filter(
        { zoom: 13 },
        {
          id: irregular.id.value,
          type: "Point",
          properties: { positionMeters: 136_772 },
        },
      ),
    ).toBe(false);
  });
});
