import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import type { MilestoneFeature } from "@/types/map-feature";

import MilestoneLayer, {
  milestonesToFeatureCollection,
} from "./milestone-layer";

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

const MILESTONE = {
  coordinates: { latitude: 45.74, longitude: 4.86 },
  kilometer: 241,
  kind: "milestone",
  label: "241+000",
  lineCode: "001000",
  sectionRank: 1,
} as const satisfies MilestoneFeature;

const MILESTONES = [MILESTONE] as const;

describe("MilestoneLayer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("converts domain milestones to stable adapter-owned GeoJSON", () => {
    expect(milestonesToFeatureCollection(MILESTONES)).toEqual({
      features: [
        {
          geometry: { coordinates: [4.86, 45.74], type: "Point" },
          id: "001000:1:241",
          properties: {
            kilometer: 241,
            kind: "milestone",
            label: "241+000",
            lineCode: "001000",
            sectionRank: 1,
          },
          type: "Feature",
        },
      ],
      type: "FeatureCollection",
    });
  });

  test("renders one source with zoom-gated dots and labels", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    await render(<MilestoneLayer milestones={MILESTONES} />);

    expect(screen.getByTestId("mock-milestone-source")).toHaveProp(
      "data",
      milestonesToFeatureCollection(MILESTONES),
    );
    expect(screen.getByTestId("mock-railway-milestone-dots")).toHaveProp(
      "minzoom",
      10,
    );
    expect(screen.getByTestId("mock-railway-milestone-labels")).toHaveProp(
      "minzoom",
      13,
    );
    expect(screen.getByTestId("mock-railway-milestone-labels")).toHaveProp(
      "layout",
      expect.objectContaining({
        "text-allow-overlap": false,
        "text-field": ["get", "label"],
      }),
    );
  });

  test("emits a validated milestone and stops press propagation", async () => {
    const onFeaturePress = jest.fn();
    const stopPropagation = jest.fn();
    const feature = milestonesToFeatureCollection(MILESTONES).features[0];
    await render(
      <MilestoneLayer
        milestones={MILESTONES}
        onFeaturePress={onFeaturePress}
      />,
    );

    await fireEvent(screen.getByTestId("mock-milestone-source"), "press", {
      nativeEvent: { features: [feature] },
      stopPropagation,
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(onFeaturePress).toHaveBeenCalledWith(MILESTONE);
  });

  test("ignores malformed or incorrectly identified features", async () => {
    const onFeaturePress = jest.fn();
    const stopPropagation = jest.fn();
    const feature = milestonesToFeatureCollection(MILESTONES).features[0];
    await render(
      <MilestoneLayer
        milestones={MILESTONES}
        onFeaturePress={onFeaturePress}
      />,
    );

    await fireEvent(screen.getByTestId("mock-milestone-source"), "press", {
      nativeEvent: { features: [{ ...feature, id: "wrong-id" }] },
      stopPropagation,
    });

    expect(stopPropagation).not.toHaveBeenCalled();
    expect(onFeaturePress).not.toHaveBeenCalled();
  });

  test("highlights the selected milestone with the theme selection color", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");
    await render(
      <MilestoneLayer milestones={MILESTONES} selectedMilestone={MILESTONE} />,
    );

    expect(screen.getByTestId("mock-railway-milestone-selected")).toHaveProp(
      "filter",
      ["==", ["id"], "001000:1:241"],
    );
    expect(screen.getByTestId("mock-railway-milestone-selected")).toHaveProp(
      "paint",
      expect.objectContaining({ "circle-color": "#FF6A00" }),
    );
  });

  test("uses the dark prototype palette", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

    await render(<MilestoneLayer milestones={MILESTONES} />);

    expect(screen.getByTestId("mock-railway-milestone-dots")).toHaveProp(
      "paint",
      expect.objectContaining({
        "circle-color": "#FAF9F6",
        "circle-stroke-color": "#363632",
      }),
    );
    expect(screen.getByTestId("mock-railway-milestone-labels")).toHaveProp(
      "paint",
      expect.objectContaining({
        "text-color": "#FAF9F6",
        "text-halo-color": "#10100F",
      }),
    );
  });
});
