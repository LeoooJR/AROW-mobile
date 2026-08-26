import { render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { type MilestoneFeatureCollection } from "@/features/milestones/milestones";

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

const MILESTONES = {
  features: [
    {
      geometry: { coordinates: [4.86, 45.74], type: "Point" },
      id: "1000:1:241",
      properties: {
        codeLigne: 1000,
        kilometer: 241,
        label: "241+000",
        latitude: 45.74,
        ligne: "001000-1",
        longitude: 4.86,
        sectionRank: 1,
      },
      type: "Feature",
    },
  ],
  type: "FeatureCollection",
} satisfies MilestoneFeatureCollection;

describe("MilestoneLayer", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders one source with zoom-gated dots and labels", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    await render(<MilestoneLayer milestones={MILESTONES} />);

    expect(screen.getByTestId("mock-milestone-source")).toHaveProp(
      "data",
      MILESTONES,
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
