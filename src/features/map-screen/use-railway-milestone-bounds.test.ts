import { act, renderHook, waitFor } from "@testing-library/react-native";
import { Milestone } from "@/features/milestones/domain/milestone";
import { Railway } from "@/features/railways/domain/railway";
import { useRailwayMilestoneBounds } from "./use-railway-milestone-bounds";
import type { RailwayMilestoneBounds } from "@/features/railway-reference/context";

const section = new Railway({
  code: "893000",
  name: "Ligne test",
  sections: [{ sectionRank: 1, geometry: { status: "absent" } }],
}).sections[0];
const point = new Milestone({
  coordinates: { latitude: 45, longitude: 4 },
  lineCode: "893000",
  sectionRank: 1,
  label: "1+000",
  positionMeters: 1000,
});

test("loads endpoints and focuses repeatedly without duplicate lookups", async () => {
  const last = new Milestone({
    coordinates: { latitude: 46, longitude: 5 },
    lineCode: "893000",
    sectionRank: 1,
    label: "2+000",
    positionMeters: 2000,
  });
  const find = jest.fn().mockResolvedValue({ first: point, last });
  const focus = jest.fn(),
    fail = jest.fn();
  const { result } = await renderHook(() =>
    useRailwayMilestoneBounds(section, find, focus, fail),
  );
  await waitFor(() => expect(result.current.loading).toBe(false));
  await act(async () => {
    result.current.onFirst();
    result.current.onFirst();
    result.current.onLast();
  });
  expect(focus).toHaveBeenCalledTimes(3);
  expect(focus.mock.calls).toEqual([
    [point.coordinates],
    [point.coordinates],
    [last.coordinates],
  ]);
  expect(find).toHaveBeenCalledTimes(1);
});

test("allows an endpoint to retry after failure and ignores concurrent presses", async () => {
  let finish!: (bounds: RailwayMilestoneBounds) => void;
  const find = jest
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockImplementationOnce(
      () =>
        new Promise<RailwayMilestoneBounds>((resolve) => {
          finish = resolve;
        }),
    );
  const focus = jest.fn(),
    fail = jest.fn();
  const { result } = await renderHook(() =>
    useRailwayMilestoneBounds(section, find, focus, fail),
  );
  await waitFor(() => expect(result.current.retryable).toBe(true));
  expect(fail).toHaveBeenCalledTimes(1);
  await act(async () => {
    result.current.onLast();
    result.current.onFirst();
  });
  expect(find).toHaveBeenCalledTimes(2);
  expect(result.current.loading).toBe(true);
  await act(async () => finish({ last: point }));
  expect(focus).toHaveBeenCalledWith(point.coordinates);
});

test("ignores an old section's result when a different section is selected", async () => {
  let finish!: (bounds: RailwayMilestoneBounds) => void;
  const other = new Railway({
    code: "894000",
    name: "Autre ligne",
    sections: [{ sectionRank: 1, geometry: { status: "absent" } }],
  }).sections[0];
  const find = jest
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<RailwayMilestoneBounds>((resolve) => {
          finish = resolve;
        }),
    )
    .mockResolvedValueOnce({});
  const focus = jest.fn(),
    fail = jest.fn();
  const { result, rerender } = await renderHook(
    ({ selected }: { selected: typeof section }) =>
      useRailwayMilestoneBounds(selected, find, focus, fail),
    { initialProps: { selected: section } },
  );
  await rerender({ selected: other });
  await waitFor(() => expect(result.current.bounds).toEqual({}));
  await act(async () => finish({ first: point, last: point }));
  expect(result.current.bounds).toEqual({});
  expect(focus).not.toHaveBeenCalled();
});

test.each(["close", "unmount"] as const)(
  "ignores late failures after %s",
  async (action) => {
    let reject!: (error: Error) => void;
    const find = jest.fn(
      () =>
        new Promise<RailwayMilestoneBounds>((_, fail) => {
          reject = fail;
        }),
    );
    const focus = jest.fn(),
      fail = jest.fn();
    const { rerender, unmount } = await renderHook(
      ({ selected }: { selected: typeof section | undefined }) =>
        useRailwayMilestoneBounds(selected, find, focus, fail),
      { initialProps: { selected: section as typeof section | undefined } },
    );
    if (action === "close") await rerender({ selected: undefined });
    else await unmount();
    await act(async () => reject(new Error("late failure")));
    expect(fail).not.toHaveBeenCalled();
    expect(focus).not.toHaveBeenCalled();
  },
);
