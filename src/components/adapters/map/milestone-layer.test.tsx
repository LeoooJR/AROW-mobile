import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { Milestone } from "@/features/milestones/domain/milestone";

import { MAP_LAYER_IDS } from "./map-layer-ids";
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
  coordinates: { latitude: 45.74, longitude: 4.86 },
  label: "241+000",
  lineCode: "001000",
  positionMeters: 241_000,
  sectionRank: 1,
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

  test("emits a validated milestone and stops press propagation", async () => {
    const onFeaturePress = jest.fn();
    const stopPropagation = jest.fn();
    await render(<MilestoneLayer onFeaturePress={onFeaturePress} />);

    await fireEvent(screen.getByTestId("mock-milestone-source"), "press", {
      nativeEvent: { features: [FEATURE] },
      stopPropagation,
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onFeaturePress).toHaveBeenCalledWith(expect.any(Milestone));
    expect(onFeaturePress.mock.calls[0]?.[0].id).toBe(MILESTONE.id);
  });

  test("accepts altitude in a pressed milestone position", async () => {
    const onFeaturePress = jest.fn();
    await render(<MilestoneLayer onFeaturePress={onFeaturePress} />);

    await fireEvent(screen.getByTestId("mock-milestone-source"), "press", {
      nativeEvent: {
        features: [
          {
            ...FEATURE,
            geometry: { ...FEATURE.geometry, coordinates: [4.86, 45.74, 172] },
          },
        ],
      },
      stopPropagation: jest.fn(),
    });

    expect(onFeaturePress.mock.calls[0]?.[0].coordinates).toEqual(
      MILESTONE.coordinates,
    );
  });

  test("ignores incorrectly identified features", async () => {
    const onFeaturePress = jest.fn();
    const stopPropagation = jest.fn();
    await render(<MilestoneLayer onFeaturePress={onFeaturePress} />);

    await fireEvent(screen.getByTestId("mock-milestone-source"), "press", {
      nativeEvent: { features: [{ ...FEATURE, id: "wrong-id" }] },
      stopPropagation,
    });

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(onFeaturePress).not.toHaveBeenCalled();
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
});
