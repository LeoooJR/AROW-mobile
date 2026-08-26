import { renderHook, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";

import { milestoneRowsToFeatureCollection, useMilestones } from "./milestones";

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

describe("milestoneRowsToFeatureCollection", () => {
  test("converts a database row to a stable GeoJSON point", () => {
    expect(milestoneRowsToFeatureCollection([VALID_ROW])).toEqual({
      features: [
        {
          geometry: {
            coordinates: [4.86234, 45.74491],
            type: "Point",
          },
          id: "1000:1:241",
          properties: {
            codeLigne: 1000,
            kilometer: 241,
            label: "241+000",
            latitude: 45.74491,
            ligne: "001000-1",
            longitude: 4.86234,
            sectionRank: 1,
          },
          type: "Feature",
        },
      ],
      type: "FeatureCollection",
    });
  });

  test("returns an empty collection for an empty result", () => {
    expect(milestoneRowsToFeatureCollection([])).toEqual({
      features: [],
      type: "FeatureCollection",
    });
  });

  test.each([
    ["a missing field", { ...VALID_ROW, label: undefined }],
    ["a non-integer key", { ...VALID_ROW, km: 1.5 }],
    ["an invalid latitude", { ...VALID_ROW, latitude: 91 }],
    ["an invalid longitude", { ...VALID_ROW, longitude: -181 }],
  ])("rejects %s", (_description, row) => {
    expect(() => milestoneRowsToFeatureCollection([row])).toThrow(
      "Invalid kilometric point at row 0",
    );
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
      expect(view.result.current).toEqual({
        collection: milestoneRowsToFeatureCollection([VALID_ROW]),
        status: "ready",
      });
    });
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
