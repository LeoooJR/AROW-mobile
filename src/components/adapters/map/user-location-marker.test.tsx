import { render, screen } from "@testing-library/react-native";
import * as ReactNative from "react-native";

import { MAP_LAYER_IDS } from "./map-layer-ids";
import UserLocationMarker from "./user-location-marker";

jest.mock("@maplibre/maplibre-react-native", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    Marker: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <MockView {...props} testID="mock-map-marker">
        {children}
      </MockView>
    ),
  };
});

jest.mock("react-native-svg", () => {
  const { View: MockView } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    __esModule: true,
    Circle: (props: Record<string, unknown>) => <MockView {...props} />,
    default: (props: Record<string, unknown>) => (
      <MockView {...props} testID="mock-marker-svg" />
    ),
    Path: (props: Record<string, unknown>) => <MockView {...props} />,
  };
});

describe("UserLocationMarker", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("positions and labels the marker", async () => {
    jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("light");

    await render(
      <UserLocationMarker
        bearing={10}
        location={{ heading: 70, latitude: 46.2276, longitude: 2.2137 }}
      />,
    );

    expect(screen.getByTestId("mock-map-marker")).toHaveProp(
      "anchor",
      "center",
    );
    expect(screen.getByTestId("mock-map-marker")).toHaveProp(
      "id",
      MAP_LAYER_IDS.userLocation,
    );
    expect(screen.getByTestId("mock-map-marker")).toHaveProp(
      "lngLat",
      [2.2137, 46.2276],
    );
    expect(screen.getByTestId("mock-map-marker")).toHaveStyle({ zIndex: 1 });
    expect(screen.getByLabelText("Position actuelle")).toBeOnTheScreen();
    expect(screen.getByTestId("mock-marker-svg")).toHaveStyle({
      transform: [{ rotate: "60deg" }],
    });
  });

  test.each([
    [null, 30, "330deg"],
    [10, 370, "0deg"],
    [-30, 20, "310deg"],
  ] as const)(
    "normalizes heading %s against bearing %s",
    async (heading, bearing, rotation) => {
      jest.spyOn(ReactNative, "useColorScheme").mockReturnValue("dark");

      await render(
        <UserLocationMarker
          bearing={bearing}
          location={{ heading, latitude: 0, longitude: 0 }}
        />,
      );

      expect(screen.getByTestId("mock-marker-svg")).toHaveStyle({
        transform: [{ rotate: rotation }],
      });
    },
  );
});
