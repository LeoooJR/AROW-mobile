import { renderHook } from "@testing-library/react-native";

import { useRailwayReference } from "./railway-reference-context";
import RailwayReferenceProvider from "./railway-reference-provider.web";

describe("RailwayReferenceProvider web fallback", () => {
  test("supplies unavailable state and an inert lookup", async () => {
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    expect(view.result.current.milestoneState).toEqual({
      status: "unavailable",
    });
    expect(view.result.current.milestoneSearch.state).toEqual({
      status: "unavailable",
    });
    await expect(
      view.result.current.milestoneSearch.findMilestone({
        lineCode: "893000",
        positionMeters: 509_000,
        sectionRank: 1,
      }),
    ).resolves.toBeUndefined();
  });
});
