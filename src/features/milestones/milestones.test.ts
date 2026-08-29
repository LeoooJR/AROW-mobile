import { renderHook, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";

import { Milestone } from "./milestone";
import { milestoneRowsToFeatures } from "./milestones";
import { useMilestones } from "./use-milestones";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: jest.fn(),
}));

const useSQLiteContextMock = jest.mocked(useSQLiteContext);

const VALID_ROW = {
  code_ligne: 1000,
  km: 241,
  label: "241+000",
  latitude: 45.74491,
  ligne: "001000-1",
  longitude: 4.86234,
  rg_troncon: 1,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}

describe("milestoneRowsToFeatures", () => {
  test("converts a database row to a normalized domain milestone", () => {
    const milestones = milestoneRowsToFeatures([VALID_ROW]);
    const milestone = milestones[0];

    expect(milestones).toHaveLength(1);
    expect(milestone).toBeInstanceOf(Milestone);
    expect(milestone?.coordinates).toEqual({
      latitude: 45.74491,
      longitude: 4.86234,
    });
    expect(milestone?.id).toBe("001000:1:241");
    expect(milestone?.label).toBe("241+000");
  });

  test("returns an empty list for an empty result", () => {
    expect(milestoneRowsToFeatures([])).toEqual([]);
  });

  test.each([
    ["a missing field", { ...VALID_ROW, label: undefined }],
    ["a non-integer key", { ...VALID_ROW, km: 1.5 }],
    ["an invalid latitude", { ...VALID_ROW, latitude: 91 }],
    ["an invalid longitude", { ...VALID_ROW, longitude: -181 }],
  ])("rejects %s", (_description, row) => {
    expect(() => milestoneRowsToFeatures([row])).toThrow(
      "Invalid milestone at row 0",
    );
  });

  test("rejects a row whose stored railway section disagrees with its keys", () => {
    expect(() =>
      milestoneRowsToFeatures([{ ...VALID_ROW, ligne: "001000-2" }]),
    ).toThrow("Invalid milestone railway section at row 0");
  });
});

describe("useMilestones", () => {
  test("reports loading while the SQLite query is pending", async () => {
    const query = deferred<unknown[]>();
    useSQLiteContextMock.mockReturnValue({
      getAllAsync: jest.fn().mockReturnValue(query.promise),
    } as never);

    const view = await renderHook(() => useMilestones());

    expect(view.result.current).toEqual({ status: "loading" });
    await view.unmount();
  });

  test("loads and converts rows from SQLite", async () => {
    const getAllAsync = jest.fn().mockResolvedValue([VALID_ROW]);
    useSQLiteContextMock.mockReturnValue({ getAllAsync } as never);

    const view = await renderHook(() => useMilestones());

    await waitFor(() => {
      expect(view.result.current.status).toBe("ready");
    });
    const state = view.result.current;
    expect(state.status).toBe("ready");
    if (state.status !== "ready") {
      throw new Error("Expected ready milestone state");
    }
    expect(state.milestones[0]).toBeInstanceOf(Milestone);
    expect(state.milestones[0]?.id).toBe("001000:1:241");
    expect(getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM kilometric_points"),
    );
  });

  test("reports a failed query without throwing", async () => {
    useSQLiteContextMock.mockReturnValue({
      getAllAsync: jest.fn().mockRejectedValue(new Error("unavailable")),
    } as never);

    const view = await renderHook(() => useMilestones());

    await waitFor(() => {
      expect(view.result.current).toEqual({ status: "error" });
    });
  });

  test("ignores a query completion after unmount", async () => {
    const query = deferred<unknown[]>();
    useSQLiteContextMock.mockReturnValue({
      getAllAsync: jest.fn().mockReturnValue(query.promise),
    } as never);

    const view = await renderHook(() => useMilestones());
    await view.unmount();
    query.resolve([VALID_ROW]);
    await query.promise;

    expect(view.result.current).toEqual({ status: "loading" });
  });
});
