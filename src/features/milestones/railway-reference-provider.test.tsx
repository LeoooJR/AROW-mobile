import { renderHook, waitFor } from "@testing-library/react-native";
import { useSQLiteContext } from "expo-sqlite";
import { type PropsWithChildren } from "react";

import { useRailwayReference } from "./railway-reference-context";
import RailwayReferenceProvider from "./railway-reference-provider";

jest.mock("expo-sqlite", () => ({
  SQLiteProvider: ({ children }: PropsWithChildren) => children,
  useSQLiteContext: jest.fn(),
}));

jest.mock("@/statics/pk.sqlite", () => "railway-reference-asset");

const useSQLiteContextMock = jest.mocked(useSQLiteContext);

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
  test("loads milestones and searchable railways independently", async () => {
    const milestones = deferred<unknown[]>();
    const railways = deferred<unknown[]>();
    useSQLiteContextMock.mockReturnValue({
      getAllAsync: jest
        .fn()
        .mockReturnValueOnce(milestones.promise)
        .mockReturnValueOnce(railways.promise),
      getFirstAsync: jest.fn().mockResolvedValue(MILESTONE_RECORD),
    } as never);
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    expect(view.result.current.milestoneState).toEqual({ status: "loading" });
    expect(view.result.current.milestoneSearch.state).toEqual({
      status: "loading",
    });
    milestones.resolve([MILESTONE_RECORD]);
    await waitFor(() => {
      expect(view.result.current.milestoneState.status).toBe("ready");
    });
    expect(view.result.current.milestoneSearch.state).toEqual({
      status: "loading",
    });
    railways.resolve([SECTION_RECORD]);
    await waitFor(() => {
      expect(view.result.current.milestoneSearch.state.status).toBe("ready");
    });
  });

  test("reports one projection failure without hiding the other", async () => {
    useSQLiteContextMock.mockReturnValue({
      getAllAsync: jest
        .fn()
        .mockRejectedValueOnce(new Error("milestones unavailable"))
        .mockResolvedValueOnce([SECTION_RECORD]),
      getFirstAsync: jest.fn(),
    } as never);
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });

    await waitFor(() => {
      expect(view.result.current.milestoneState).toEqual({ status: "error" });
    });
    await waitFor(() => {
      expect(view.result.current.milestoneSearch.state.status).toBe("ready");
    });
  });

  test("keeps exact lookup stable until the database changes", async () => {
    const firstDatabase = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    const secondDatabase = {
      getAllAsync: jest.fn().mockResolvedValue([]),
      getFirstAsync: jest.fn().mockResolvedValue(null),
    };
    let currentDatabase = firstDatabase;
    useSQLiteContextMock.mockImplementation(() => currentDatabase as never);
    const view = await renderHook(() => useRailwayReference(), {
      wrapper: RailwayReferenceProvider,
    });
    const firstLookup = view.result.current.milestoneSearch.findMilestone;

    await view.rerender(undefined);
    expect(view.result.current.milestoneSearch.findMilestone).toBe(firstLookup);
    await firstLookup({
      lineCode: "893000",
      positionMeters: 509_000,
      sectionRank: 1,
    });
    expect(firstDatabase.getFirstAsync).toHaveBeenCalled();

    currentDatabase = secondDatabase;
    await view.rerender(undefined);
    const secondLookup = view.result.current.milestoneSearch.findMilestone;
    expect(secondLookup).not.toBe(firstLookup);
    await secondLookup({
      lineCode: "893000",
      positionMeters: 509_000,
      sectionRank: 1,
    });
    expect(secondDatabase.getFirstAsync).toHaveBeenCalled();
  });

  test("rejects use outside its provider", async () => {
    await expect(renderHook(() => useRailwayReference())).rejects.toThrow(
      "useRailwayReference must be used within RailwayReferenceProvider",
    );
  });
});
