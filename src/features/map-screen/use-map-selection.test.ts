import { act, renderHook } from "@testing-library/react-native";
import { BackHandler } from "react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { useMapSelection } from "@/features/map-screen/use-map-selection";

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});

describe("useMapSelection", () => {
  test("distinguishes searched points from map selections", async () => {
    const { result } = await renderHook(useMapSelection);

    await act(async () => result.current.onMilestoneSelect(milestone));
    expect(result.current.selectedSimulationMilestone).toBe(milestone);
    expect(result.current.milestoneFocusRequest).toBe(1);

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
