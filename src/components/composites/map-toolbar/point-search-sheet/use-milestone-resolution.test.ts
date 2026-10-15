import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { renderHook, waitFor } from "@testing-library/react-native";

import useMilestoneResolution from "@/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution";
import { Milestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { Railway } from "@shared/railway-domain/railway";

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
    id: new MilestoneId(
      new RailwaySectionId(line.code, section?.sectionRank ?? 1),
      positionMeters,
    ),
    coordinates: { latitude: 45.74744, longitude: 4.85933 },
    label: `${kilometer}+${String(metric).padStart(3, "0")}`,
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
    const requestedId = findMilestone.mock.calls[0]?.[0] as MilestoneId;
    expect(requestedId).toBeInstanceOf(MilestoneId);
    expect(requestedId.value).toBe("893000:1:509000");
    expect(requestedId.sectionId).toBe(section?.id);
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

  test("correlates equivalent IDs from separately constructed sections", async () => {
    const found = milestone(509_000);
    const findMilestone = jest
      .fn()
      .mockResolvedValueOnce(found)
      .mockReturnValueOnce(new Promise(() => {}));
    const view = await renderHook(
      ({ selected }: { readonly selected: typeof section }) =>
        useMilestoneResolution({
          findMilestone,
          kilometer: "509",
          metric: "000",
          line,
          section: selected,
        }),
      { initialProps: { selected: section } },
    );
    await waitFor(() => expect(view.result.current.status).toBe("ready"));
    const equivalentSection = new Railway({
      code: line.code,
      name: line.name,
      sections: [
        {
          sectionRank: 1,
          geometry: { status: "absent" },
          milestoneRange: section?.milestoneRange,
        },
      ],
    }).sections[0];
    expect(equivalentSection?.id).not.toBe(section?.id);
    await view.rerender({ selected: equivalentSection });
    expect(view.result.current).toEqual({ status: "ready", milestone: found });
    expect(
      findMilestone.mock.calls.map(([id]) => (id as MilestoneId).value),
    ).toEqual(["893000:1:509000", "893000:1:509000"]);
  });

  test("ignores a stale lookup after the input changes", async () => {
    const first = deferred<Milestone | undefined>();
    const second = deferred<Milestone | undefined>();
    const findMilestone = jest.fn((input: MilestoneId) =>
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
