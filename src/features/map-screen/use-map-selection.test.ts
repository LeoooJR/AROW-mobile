import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { act, renderHook } from "@testing-library/react-native";
import { BackHandler } from "react-native";

import { Milestone } from "@shared/railway-domain/milestone";
import { useMapSelection } from "@/features/map-screen/use-map-selection";

const milestone = new Milestone({
  id: new MilestoneId(new RailwaySectionId("893000", 1), 509_000),
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
});

describe("useMapSelection", () => {
  test("neighbour selection updates camera and removes the pending search target", async () => {
    const { result } = await renderHook(useMapSelection);
    await act(async () => result.current.onMilestoneSelect(milestone));
    const visibility = result.current.layerVisibility;
    await act(async () => result.current.onMilestoneNavigate(milestone));
    expect(result.current.selectedFeature).toBe(milestone);
    expect(result.current.selectedSimulationMilestone).toBeUndefined();
    expect(result.current.focusRequest).toBe(2);
    expect(result.current.focusLocation).toBe(milestone.coordinates);
    expect(result.current.layerVisibility).toBe(visibility);
  });
  test("camera focus is repeatable and independent from selected feature and layers", async () => {
    const { result } = await renderHook(useMapSelection);
    await act(async () => result.current.onFeaturePress(milestone));
    const visibility = result.current.layerVisibility;
    const target = { latitude: 46, longitude: 5 };
    await act(async () => result.current.focusOnLocation(target));
    await act(async () => result.current.focusOnLocation(target));
    expect(result.current.focusRequest).toBe(2);
    expect(result.current.focusLocation).toEqual(target);
    expect(result.current.selectedFeature).toBe(milestone);
    expect(result.current.selectedSimulationMilestone).toBeUndefined();
    expect(result.current.layerVisibility).toBe(visibility);
  });
  test("distinguishes searched points from map selections", async () => {
    const { result } = await renderHook(useMapSelection);

    await act(async () => result.current.onMilestoneSelect(milestone));
    expect(result.current.selectedSimulationMilestone).toBe(milestone);
    expect(result.current.focusRequest).toBe(1);

    await act(async () => result.current.onFeaturePress(milestone));
    expect(result.current.selectedFeature).toBe(milestone);
    expect(result.current.selectedSimulationMilestone).toBeUndefined();
  });

  test("hiding the selected milestone clears selection without changing another layer", async () => {
    const { result } = await renderHook(useMapSelection);
    await act(async () => result.current.onMilestoneSelect(milestone));

    await act(async () => result.current.onVisibilityChange("railway", false));
    expect(result.current.selectedFeature).toBe(milestone);
    await act(async () =>
      result.current.onVisibilityChange("milestone", false),
    );
    expect(result.current.selectedFeature).toBeUndefined();
    expect(result.current.layerVisibility).toEqual({
      milestone: false,
      railway: false,
    });
  });

  test("Android Back exits map-only mode and removes its listener", async () => {
    let backHandler:
      Parameters<typeof BackHandler.addEventListener>[1] | undefined;
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(BackHandler, "addEventListener")
      .mockImplementation((_eventName, handler) => {
        backHandler = handler;
        return { remove };
      });
    const { result, unmount } = await renderHook(useMapSelection);

    await act(async () => result.current.onMapFocusChange(true));
    expect(addEventListener).toHaveBeenCalledTimes(1);
    await act(async () => {
      expect(backHandler?.({ type: "hardwareBackPress", timeStamp: 0 })).toBe(
        true,
      );
    });
    expect(result.current.mapFocused).toBe(false);
    expect(remove).toHaveBeenCalledTimes(1);
    await unmount();
    addEventListener.mockRestore();
  });
});
