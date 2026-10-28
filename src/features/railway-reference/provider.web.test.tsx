import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { act, renderHook } from "@testing-library/react-native";

import { useRailwayReference } from "@/features/use-railway-reference";
import RailwayReferenceProvider from "./provider.web";
import { useVisibleMilestones } from "@/features/use-visible-milestones";

describe("RailwayReferenceProvider web fallback", () => {
  test("supports the shared viewport hook with stable empty results", async () => {
    jest.useFakeTimers();
    try {
      const view = await renderHook(
        () => ({
          reference: useRailwayReference(),
          points: useVisibleMilestones(
            { bounds: [4, 45, 5, 46], zoom: 15 },
            true,
          ),
        }),
        { wrapper: RailwayReferenceProvider },
      );
      await act(async () => jest.advanceTimersByTime(151));
      expect(view.result.current.points).toEqual([]);
      const first = await view.result.current.reference.findVisibleMilestones(
        [4, 45, 5, 46],
        1,
      );
      const second = await view.result.current.reference.findVisibleMilestones(
        [179, -1, -179, 1],
        1000,
      );
      expect(first).toBe(second);
      expect(view.result.current.points).toBe(first);
      await view.unmount();
    } finally {
      jest.useRealTimers();
    }
  });
  test("supplies unavailable state and an inert lookup", async () => {
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    expect(view.result.current.milestoneSearch.state).toEqual({
      status: "unavailable",
    });
    expect(() =>
      view.result.current.milestoneSearch.loadRailways(),
    ).not.toThrow();
    await expect(
      view.result.current.milestoneSearch.findMilestone(
        new MilestoneId(new RailwaySectionId("893000", 1), 509_000),
      ),
    ).resolves.toBeUndefined();
  });
});
