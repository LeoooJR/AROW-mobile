import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Milestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import type { MilestoneNeighbours } from "@shared/railway-domain/milestone-neighbours";
import { useMilestoneNeighbours } from "./use-milestone-neighbours";

const point = (km: number) =>
  new Milestone({
    id: new MilestoneId(new RailwaySectionId("893000", 1), km * 1000),
    label: `${km}+000`,
    coordinates: { latitude: 45, longitude: 4 },
  });
const current = point(509),
  previous = point(508),
  next = point(510);
const neighbours = {
  previous,
  current,
  next,
  positionInSection: 10,
  total: 12,
};

test("loads once, navigates once despite rapid presses, and reloads for the next selection", async () => {
  const find = jest.fn().mockResolvedValue(neighbours),
    navigate = jest.fn(),
    fail = jest.fn();
  const { result, rerender } = await renderHook(
    ({ selected }: { selected: Milestone }) =>
      useMilestoneNeighbours(selected, find, navigate, fail),
    { initialProps: { selected: current } },
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(find).toHaveBeenCalledWith(current.id);
  await act(async () => {
    result.current.onNext?.();
    result.current.onPrevious?.();
    result.current.onNext?.();
  });
  expect(navigate.mock.calls).toEqual([[next]]);
  await rerender({ selected: next });
  await waitFor(() => expect(find).toHaveBeenCalledTimes(2));
});

test("failure retries the requested direction without overlapping lookups", async () => {
  let finish!: (data: MilestoneNeighbours) => void;
  const find = jest
    .fn()
    .mockRejectedValueOnce(Error("offline"))
    .mockImplementationOnce(
      () =>
        new Promise<MilestoneNeighbours>((resolve) => {
          finish = resolve;
        }),
    );
  const navigate = jest.fn(),
    fail = jest.fn();
  const { result } = await renderHook(() =>
    useMilestoneNeighbours(current, find, navigate, fail),
  );
  await waitFor(() => expect(result.current.retryable).toBe(true));
  expect(fail).toHaveBeenCalledTimes(1);
  await act(async () => {
    result.current.onPrevious?.();
    result.current.onNext?.();
  });
  expect(find).toHaveBeenCalledTimes(2);
  expect(result.current.loading).toBe(true);
  await act(async () => finish(neighbours));
  expect(navigate.mock.calls).toEqual([[previous]]);
});

test.each(["replacement", "closure", "layer hiding", "map-only", "unmount"])(
  "ignores late retry results after %s",
  async (action) => {
    let finish!: (data: MilestoneNeighbours) => void;
    const find = jest
      .fn()
      .mockRejectedValueOnce(Error("offline"))
      .mockImplementationOnce(
        () =>
          new Promise<MilestoneNeighbours>((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    const navigate = jest.fn(),
      fail = jest.fn();
    const { result, rerender, unmount } = await renderHook(
      ({ selected }: { selected: Milestone | undefined }) =>
        useMilestoneNeighbours(selected, find, navigate, fail),
      { initialProps: { selected: current as Milestone | undefined } },
    );
    await waitFor(() => expect(result.current.retryable).toBe(true));
    await act(async () => result.current.onNext?.());
    if (action === "unmount") await unmount();
    else
      await rerender({ selected: action === "replacement" ? next : undefined });
    await act(async () => finish(neighbours));
    expect(navigate).not.toHaveBeenCalled();
    expect(fail).toHaveBeenCalledTimes(1);
  },
);

test("unavailable results and missing directions never navigate or announce errors", async () => {
  const find = jest.fn().mockResolvedValue(undefined),
    navigate = jest.fn(),
    fail = jest.fn();
  const { result } = await renderHook(() =>
    useMilestoneNeighbours(current, find, navigate, fail),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    result.current.onNext?.();
    result.current.onPrevious?.();
  });
  expect(result.current.neighbours).toBeUndefined();
  expect(navigate).not.toHaveBeenCalled();
  expect(fail).not.toHaveBeenCalled();
});
