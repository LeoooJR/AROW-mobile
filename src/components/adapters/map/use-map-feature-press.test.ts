import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { NativeSyntheticEvent } from "react-native";
import type { PressEvent } from "@maplibre/maplibre-react-native";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { Milestone } from "@shared/railway-domain/milestone";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { useMapFeaturePress } from "./use-map-feature-press";

const milestone = new Milestone({
  id: new MilestoneId(new RailwaySectionId("001000", 1), 1000),
  label: "001+000",
  coordinates: { longitude: 4, latitude: 45 },
});
const event = {
  nativeEvent: { point: [100, 100], lngLat: [4, 45] },
} as NativeSyntheticEvent<PressEvent>;
type Options = Parameters<typeof useMapFeaturePress>[0];

function setup() {
  let resolve!: (features: GeoJSON.Feature[]) => void;
  const pending = new Promise<GeoJSON.Feature[]>((done) => {
    resolve = done;
  });
  const native = {
    getZoom: jest.fn().mockResolvedValue(15),
    project: jest.fn().mockResolvedValue([100, 100]),
    queryRenderedFeatures: jest.fn().mockReturnValue(pending),
  };
  const options: Options = {
    map: { current: native },
    ready: { current: true },
    onFeaturePress: jest.fn(),
    visibility: { milestone: true, railway: true },
    railwayAvailable: true,
    selectedSection: false,
    milestoneData: [milestone],
    railwayData: "file:///railways.geojson",
  };
  return { native, options, resolve };
}

test("emits a single validated feature after native hit testing", async () => {
  const { options, resolve } = setup();
  const view = await renderHook(() => useMapFeaturePress(options));
  await act(async () => view.result.current.onPress(event));
  await act(async () => resolve([milestone.toGeoJSON()]));
  await waitFor(() => expect(options.onFeaturePress).toHaveBeenCalledTimes(1));
  expect(options.onFeaturePress).toHaveBeenCalledWith(
    expect.objectContaining({ id: milestone.id }),
  );
});

test.each([
  "camera",
  "selection",
  "visibility",
  "source",
  "style",
  "unmount",
] as const)("ignores results invalidated by %s", async (reason) => {
  const { options, resolve } = setup();
  const view = await renderHook((props: Options) => useMapFeaturePress(props), {
    initialProps: options,
  });
  await act(async () => view.result.current.onPress(event));
  if (reason === "camera") view.result.current.invalidate();
  if (reason === "selection")
    await view.rerender({
      ...options,
      selectedFeature: milestone,
      selectedMilestone: milestone,
      selectedSection: true,
    });
  if (reason === "visibility")
    await view.rerender({
      ...options,
      visibility: { milestone: false, railway: true },
    });
  if (reason === "source")
    await view.rerender({ ...options, milestoneData: [] });
  if (reason === "style") options.ready.current = false;
  if (reason === "unmount") await view.unmount();
  await act(async () => resolve([milestone.toGeoJSON()]));
  expect(options.onFeaturePress).not.toHaveBeenCalled();
});

test("only the newest tap can change selection", async () => {
  const { options, native, resolve } = setup();
  const view = await renderHook(() => useMapFeaturePress(options));
  await act(async () => view.result.current.onPress(event));
  native.queryRenderedFeatures.mockResolvedValueOnce([milestone.toGeoJSON()]);
  await act(async () => view.result.current.onPress(event));
  await waitFor(() => expect(options.onFeaturePress).toHaveBeenCalledTimes(1));
  await act(async () => resolve([milestone.toGeoJSON()]));
  expect(options.onFeaturePress).toHaveBeenCalledTimes(1);
});

test.each(["getZoom", "queryRenderedFeatures", "project"] as const)(
  "leaves selection unchanged when %s fails",
  async (method) => {
    const { options, native } = setup();
    native.queryRenderedFeatures.mockResolvedValue([milestone.toGeoJSON()]);
    native[method].mockRejectedValue(Error("Native failure"));
    const view = await renderHook(() => useMapFeaturePress(options));
    await act(async () => view.result.current.onPress(event));
    expect(options.onFeaturePress).not.toHaveBeenCalled();
  },
);

test("does not query an unready map", async () => {
  const { options, native } = setup();
  options.ready.current = false;
  const view = await renderHook(() => useMapFeaturePress(options));
  await act(async () => view.result.current.onPress(event));
  expect(native.getZoom).not.toHaveBeenCalled();
});
