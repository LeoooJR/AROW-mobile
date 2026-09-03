import { render, screen } from "@testing-library/react-native";

import MapCamera from "./map-camera";

const mockEaseTo = jest.fn();
let mockReduceMotion = false;

jest.mock("react-native-reanimated", () => ({
  useReducedMotion: () => mockReduceMotion,
}));

jest.mock("@maplibre/maplibre-react-native", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } =
    jest.requireActual<typeof import("react-native")>("react-native");

  return {
    Camera: React.forwardRef(function MockCamera(
      props: Record<string, unknown>,
      ref: React.ForwardedRef<{ easeTo: typeof mockEaseTo }>,
    ) {
      React.useImperativeHandle(ref, () => ({ easeTo: mockEaseTo }));
      return <View {...props} />;
    }),
  };
});

describe("MapCamera", () => {
  beforeEach(() => {
    mockEaseTo.mockClear();
    mockReduceMotion = false;
  });

  test("starts at the world view without a location", async () => {
    await render(<MapCamera />);

    expect(screen.getByTestId("arow-map-camera")).toHaveProp("center", [0, 0]);
    expect(screen.getByTestId("arow-map-camera")).toHaveProp("zoom", 0);
    expect(screen.getByTestId("arow-map-camera")).toHaveProp("duration", 700);
  });

  test("starts on a supplied location", async () => {
    await render(
      <MapCamera location={{ latitude: 48.8584, longitude: 2.2945 }} />,
    );

    expect(screen.getByTestId("arow-map-camera")).toHaveProp(
      "center",
      [2.2945, 48.8584],
    );
    expect(screen.getByTestId("arow-map-camera")).toHaveProp("zoom", 15);
  });

  test("updates its declarative target when location availability changes", async () => {
    const view = await render(<MapCamera />);

    await view.rerender(
      <MapCamera location={{ latitude: 45.764, longitude: 4.8357 }} />,
    );
    expect(screen.getByTestId("arow-map-camera")).toHaveProp(
      "center",
      [4.8357, 45.764],
    );

    await view.rerender(<MapCamera />);
    expect(screen.getByTestId("arow-map-camera")).toHaveProp("center", [0, 0]);
  });

  test("animates an explicit recenter request", async () => {
    const location = { latitude: 47.2184, longitude: -1.5536 };
    const view = await render(
      <MapCamera location={location} recenterRequest={0} />,
    );

    await view.rerender(<MapCamera location={location} recenterRequest={1} />);

    expect(mockEaseTo).toHaveBeenCalledWith({
      bearing: 0,
      center: [-1.5536, 47.2184],
      duration: 700,
      easing: "ease",
      pitch: 0,
      zoom: 15,
    });
  });

  test("focuses the same searched milestone for every changed request", async () => {
    const focusLocation = { latitude: 45.74744, longitude: 4.85933 };
    const view = await render(
      <MapCamera focusLocation={focusLocation} focusRequest={0} />,
    );

    await view.rerender(
      <MapCamera focusLocation={focusLocation} focusRequest={1} />,
    );
    await view.rerender(
      <MapCamera focusLocation={focusLocation} focusRequest={2} />,
    );

    expect(mockEaseTo).toHaveBeenCalledTimes(2);
    expect(mockEaseTo).toHaveBeenLastCalledWith({
      bearing: 0,
      center: [4.85933, 45.74744],
      duration: 700,
      easing: "ease",
      pitch: 0,
      zoom: 15,
    });
  });

  test("does not recenter without a location or a changed request", async () => {
    const view = await render(<MapCamera recenterRequest={0} />);

    await view.rerender(<MapCamera recenterRequest={1} />);
    await view.rerender(<MapCamera recenterRequest={1} />);

    expect(mockEaseTo).not.toHaveBeenCalled();
  });

  test("disables camera transition duration when reduced motion is enabled", async () => {
    mockReduceMotion = true;
    const location = { latitude: 43.6047, longitude: 1.4442 };
    const view = await render(
      <MapCamera location={location} recenterRequest={0} />,
    );

    expect(screen.getByTestId("arow-map-camera")).toHaveProp("duration", 0);

    await view.rerender(<MapCamera location={location} recenterRequest={1} />);
    expect(mockEaseTo).toHaveBeenCalledWith(
      expect.objectContaining({ duration: 0 }),
    );
  });
});
