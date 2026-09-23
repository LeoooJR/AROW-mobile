import { act, renderHook, waitFor } from "@testing-library/react-native";
import { type SQLiteDatabase, useSQLiteContext } from "expo-sqlite";
import { type PropsWithChildren } from "react";

import { useRailwayReference } from "./context";
import RailwayReferenceProvider from "./provider";
import { FIND_MILESTONE_QUERY } from "./sqlite/queries";

jest.mock("expo-sqlite", () => ({
  SQLiteProvider: ({ children }: PropsWithChildren) => children,
  useSQLiteContext: jest.fn(),
}));
jest.mock("@/statics/railway_reference.sqlite", () => "database-asset");

const useSQLiteContextMock = jest.mocked(useSQLiteContext);
type DatabaseMock = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync">;
const asDatabase = (database: DatabaseMock): SQLiteDatabase =>
  database as SQLiteDatabase;

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

const MILESTONE_RECORD = {
  code_ligne: "893000",
  label: "509+000",
  latitude: 45.74744,
  longitude: 4.85933,
  position_m: 509_000,
  rg_troncon: 1,
};
const SECTION_RECORD = {
  code_ligne: "893000",
  has_geometry: 1,
  idgaia: "gaia-id",
  lib_ligne: "Ligne test",
  maximum_label: "509+000",
  maximum_position_m: 509_000,
  minimum_label: "499+000",
  minimum_position_m: 499_000,
  pkd: "499+752",
  pkf: "511+605",
  rg_troncon: 1,
  type_ligne: "Ligne",
};

describe("RailwayReferenceProvider", () => {
  test("does not load the searchable catalog while mounting", async () => {
    const getAllAsync = jest.fn();
    useSQLiteContextMock.mockReturnValue(
      asDatabase({ getAllAsync, getFirstAsync: jest.fn() }),
    );
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    expect(view.result.current.milestoneSearch.state).toEqual({
      status: "idle",
    });
    expect(getAllAsync).not.toHaveBeenCalled();
  });

  test("loads the searchable catalog once and caches it", async () => {
    const rows = deferred<unknown[]>();
    const getAllAsync = jest.fn().mockReturnValue(rows.promise);
    useSQLiteContextMock.mockReturnValue(
      asDatabase({ getAllAsync, getFirstAsync: jest.fn() }),
    );
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    await act(async () => {
      view.result.current.milestoneSearch.loadRailways();
    });
    expect(view.result.current.milestoneSearch.state).toEqual({
      status: "loading",
    });
    await act(async () => {
      view.result.current.milestoneSearch.loadRailways();
    });
    expect(getAllAsync).toHaveBeenCalledTimes(1);
    rows.resolve([SECTION_RECORD]);
    await waitFor(() =>
      expect(view.result.current.milestoneSearch.state.status).toBe("ready"),
    );
    await act(async () => {
      view.result.current.milestoneSearch.loadRailways();
    });
    expect(getAllAsync).toHaveBeenCalledTimes(1);
  });

  test("preserves catalog errors without retrying", async () => {
    const getAllAsync = jest.fn().mockRejectedValue(new Error("unavailable"));
    useSQLiteContextMock.mockReturnValue(
      asDatabase({ getAllAsync, getFirstAsync: jest.fn() }),
    );
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    await act(async () => {
      view.result.current.milestoneSearch.loadRailways();
    });
    await waitFor(() =>
      expect(view.result.current.milestoneSearch.state).toEqual({
        status: "error",
      }),
    );
    await act(async () => {
      view.result.current.milestoneSearch.loadRailways();
    });
    expect(getAllAsync).toHaveBeenCalledTimes(1);
  });

  test("finds an exact milestone before loading the catalog", async () => {
    const getAllAsync = jest.fn();
    const getFirstAsync = jest.fn().mockResolvedValue(MILESTONE_RECORD);
    useSQLiteContextMock.mockReturnValue(
      asDatabase({ getAllAsync, getFirstAsync }),
    );
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    const milestone = await view.result.current.milestoneSearch.findMilestone({
      lineCode: "893000",
      positionMeters: 509_000,
      sectionRank: 1,
    });

    expect(milestone?.id).toBe("893000:1:509000");
    expect(getFirstAsync).toHaveBeenCalledWith(
      FIND_MILESTONE_QUERY,
      "893000",
      1,
      509_000,
    );
    expect(getAllAsync).not.toHaveBeenCalled();
  });

  test("rejects use outside its provider", async () => {
    await expect(renderHook(() => useRailwayReference())).rejects.toThrow(
      "useRailwayReference must be used within RailwayReferenceProvider",
    );
  });
});
