import { act, renderHook } from "@testing-library/react-native";
import { Milestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import type { MapViewport } from "@/types/map-viewport";
import { findVisibleMilestones } from "./visible-milestones";
import { useVisibleMilestones } from "./use-visible-milestones";

jest.mock("expo-sqlite", () => {
  const database = {};
  return { useSQLiteContext: () => database };
});
jest.mock("./visible-milestones", () => ({
  ...jest.requireActual("./visible-milestones"),
  findVisibleMilestones: jest.fn(),
}));
const find = jest.mocked(findVisibleMilestones);
const viewport: MapViewport = { bounds: [4, 45, 5, 46], zoom: 14 };
const point = new Milestone({
  id: new MilestoneId(new RailwaySectionId("001000", 1), 100),
  label: "000+100",
  coordinates: { latitude: 45.5, longitude: 4.5 },
});

beforeEach(() => {
  jest.useFakeTimers();
  find.mockReset();
  find.mockResolvedValue([point]);
});
afterEach(() => jest.useRealTimers());

test("does not load the whole reference before a visible marker viewport exists", async () => {
  const view = await renderHook(
    ({ area, visible }: { area: MapViewport | undefined; visible: boolean }) =>
      useVisibleMilestones(area, visible),
    { initialProps: { area: undefined, visible: true } },
  );
  await act(async () => jest.advanceTimersByTime(200));
  expect(find).not.toHaveBeenCalled();
  await view.rerender({ area: { ...viewport, zoom: 9 }, visible: true });
  await act(async () => jest.advanceTimersByTime(200));
  expect(find).not.toHaveBeenCalled();
  await view.rerender({ area: viewport, visible: true });
  await act(async () => jest.advanceTimersByTime(151));
  expect(view.result.current).toEqual([point]);
  expect(find).toHaveBeenCalledWith(expect.anything(), viewport.bounds);
  await view.rerender({ area: viewport, visible: false });
  expect(view.result.current).toEqual([]);
});

test("debounces camera changes and ignores late results for obsolete views", async () => {
  let finish!: (rows: readonly Milestone[]) => void;
  find.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const view = await renderHook(
    ({ area }: { area: MapViewport }) => useVisibleMilestones(area, true),
    { initialProps: { area: viewport } },
  );
  await act(async () => jest.advanceTimersByTime(151));
  await view.rerender({ area: { bounds: [5, 45, 6, 46], zoom: 14 } });
  await view.rerender({ area: { bounds: [6, 45, 7, 46], zoom: 14 } });
  find.mockResolvedValueOnce([]);
  await act(async () => jest.advanceTimersByTime(151));
  expect(find).toHaveBeenCalledTimes(2);
  await act(async () => finish([point]));
  expect(view.result.current).toEqual([]);
});

test("a failed request clears stale points without failing basemap startup", async () => {
  const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  try {
    find.mockRejectedValueOnce(new Error("unavailable"));
    const view = await renderHook(() => useVisibleMilestones(viewport, true));
    await act(async () => jest.advanceTimersByTime(151));
    expect(view.result.current).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      "Unable to load visible railway points",
      expect.any(Error),
    );
  } finally {
    warn.mockRestore();
  }
});
