import { renderHook } from "@testing-library/react-native";

import { useMilestones } from "./use-milestones.web";

describe("useMilestones web fallback", () => {
  test("keeps milestone storage unavailable on web", async () => {
    const view = await renderHook(() => useMilestones());

    expect(view.result.current).toEqual({ status: "unavailable" });
  });
});
