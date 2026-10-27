import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { renderHook } from "@testing-library/react-native";

import { useRailwayReference } from "@/features/use-railway-reference";
import RailwayReferenceProvider from "./provider.web";

describe("RailwayReferenceProvider web fallback", () => {
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
