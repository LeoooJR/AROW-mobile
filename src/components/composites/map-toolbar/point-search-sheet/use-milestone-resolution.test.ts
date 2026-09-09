import { renderHook, waitFor } from "@testing-library/react-native";

import useMilestoneResolution from "@/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution";
import { Milestone } from "@/features/milestones/milestone";
import type { MilestoneLookupInput } from "@/features/milestones/milestone-search";
import { Railway } from "@/features/railways/railway";

const line = new Railway({
  code: "893000",
  name: "Ligne de Collonges-Fontaines à Lyon-Guillotière",
  sections: [
    {
      geometry: { status: "absent" },
      milestoneRange: {
        maximumLabel: "510+000",
        maximumPositionMeters: 510_000,
        minimumLabel: "508+000",
        minimumPositionMeters: 508_000,
      },
      sectionRank: 1,
    },
  ],
});
const section = line.sections[0];

function milestone(positionMeters: number): Milestone {
  const kilometer = Math.floor(positionMeters / 1000);
  const metric = positionMeters % 1000;
  return new Milestone({
    coordinates: { latitude: 45.74744, longitude: 4.85933 },
    label: `${kilometer}+${String(metric).padStart(3, "0")}`,
    lineCode: line.code,
    positionMeters,
    sectionRank: section?.sectionRank ?? 1,
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useMilestoneResolution", () => {
  test("loads and exposes an exact database milestone", async () => {
    const found = milestone(509_000);
    const lookup = deferred<Milestone | undefined>();
    const findMilestone = jest.fn().mockReturnValue(lookup.promise);
    const view = await renderHook(() =>
      useMilestoneResolution({
        findMilestone,
        kilometer: "509",
        line,
        metric: "000",
        section,
      }),
    );

    expect(view.result.current).toEqual({ status: "loading" });
    lookup.resolve(found);
    await waitFor(() => {
      expect(view.result.current).toEqual({
        milestone: found,
        status: "ready",
      });
    });
    expect(findMilestone).toHaveBeenCalledWith({
      lineCode: "893000",
      positionMeters: 509_000,
      sectionRank: 1,
    });
  });

  test("reports unavailable points and database failures", async () => {
    const findUnavailable = jest.fn().mockResolvedValue(undefined);
    let view = await renderHook(() =>
      useMilestoneResolution({
        findMilestone: findUnavailable,
        kilometer: "509",
        line,
        metric: "000",
        section,
      }),
    );
    await waitFor(() => {
      expect(view.result.current).toMatchObject({ status: "error" });
    });
    await view.unmount();

    const findError = jest.fn().mockRejectedValue(new Error("unavailable"));
    view = await renderHook(() =>
      useMilestoneResolution({
        findMilestone: findError,
        kilometer: "509",
        line,
        metric: "000",
        section,
      }),
    );
    await waitFor(() => {
      expect(view.result.current).toEqual({
        message: "La recherche de ce repère est momentanément indisponible.",
        status: "error",
      });
    });
    await view.unmount();
  });

  test("ignores a stale lookup after the input changes", async () => {
    const first = deferred<Milestone | undefined>();
    const second = deferred<Milestone | undefined>();
    const findMilestone = jest.fn((input: MilestoneLookupInput) =>
      input.positionMeters === 509_000 ? first.promise : second.promise,
    );
    const view = await renderHook(
      ({ metric }: { readonly metric: string }) =>
        useMilestoneResolution({
          findMilestone,
          kilometer: "509",
          line,
          metric,
          section,
        }),
      { initialProps: { metric: "000" } },
    );

    await waitFor(() => {
      expect(findMilestone).toHaveBeenCalledTimes(1);
    });
    await view.rerender({ metric: "500" });
    await waitFor(() => {
      expect(findMilestone).toHaveBeenCalledTimes(2);
    });
    first.resolve(milestone(509_000));
    await first.promise;
    expect(view.result.current).toEqual({ status: "loading" });

    const latest = milestone(509_500);
    second.resolve(latest);
    await waitFor(() => {
      expect(view.result.current).toEqual({
        milestone: latest,
        status: "ready",
      });
    });
  });
});
