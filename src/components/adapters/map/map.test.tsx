import { fireEvent, render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { type MilestoneFeatureCollection } from "@/features/milestones/milestones";

import { DARK_MAP_STYLE } from "./map-style-dark";
import { LIGHT_MAP_STYLE } from "./map-style-light";
import Map from "./map";

const MILESTONES: MilestoneFeatureCollection = {
  features: [],
  type: "FeatureCollection",
};

jest.mock("@maplibre/maplibre-react-native", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    Map: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <MockView {...props}>{children}</MockView>
    ),
  };
});

jest.mock("./map-camera", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-map-camera" />
    ),
  };
});

jest.mock("./user-location-marker", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-user-location-marker" />
    ),
  };
});

jest.mock("./milestone-layer", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-milestone-layer" />
    ),
  };
});

describe("Map", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("uses the light map style and omits the marker without a location", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    await render(<Map recenterRequest={3} />);

    expect(screen.getByTestId("arow-map")).toHaveProp(
      "accessibilityLabel",
      "Carte ferroviaire interactive AROW",
    );
    expect(screen.getByTestId("arow-map")).toHaveProp(
      "mapStyle",
      LIGHT_MAP_STYLE,
    );
    expect(screen.getByTestId("mock-map-camera")).toHaveProp(
      "recenterRequest",
      3,
    );
    expect(screen.queryByTestId("mock-user-location-marker")).toBeNull();
    expect(screen.queryByTestId("mock-milestone-layer")).toBeNull();
  });

  test("uses the dark style and forwards location to camera and marker", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");
    const location = {
      heading: 90,
      latitude: 48.8566,
      longitude: 2.3522,
    };

    await render(<Map location={location} recenterRequest={2} />);

    expect(screen.getByTestId("arow-map")).toHaveProp(
      "mapStyle",
      DARK_MAP_STYLE,
    );
    expect(screen.getByTestId("mock-map-camera")).toHaveProp(
      "location",
      location,
    );
    expect(screen.getByTestId("mock-user-location-marker")).toHaveProp(
      "location",
      location,
    );
    expect(screen.getByTestId("mock-user-location-marker")).toHaveProp(
      "bearing",
      0,
    );
  });

  test("updates marker rotation input after the map bearing changes", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");
    const location = { heading: null, latitude: 48, longitude: 2 };
    await render(<Map location={location} />);

    await fireEvent(screen.getByTestId("arow-map"), "regionDidChange", {
      nativeEvent: { bearing: 37 },
    });

    expect(screen.getByTestId("mock-user-location-marker")).toHaveProp(
      "bearing",
      37,
    );
  });

  test("forwards milestone data to its presentation layer", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    await render(<Map milestones={MILESTONES} />);

    expect(screen.getByTestId("mock-milestone-layer")).toHaveProp(
      "milestones",
      MILESTONES,
    );
  });
});
