import { act, renderHook, waitFor } from "@testing-library/react-native";

import useRailwayReferenceLoad from "./use-railway-reference-load";

function deferred<Value>() {
  let resolve!: (value: Value) => void;
  const promise = new Promise<Value>((promiseResolve) => {
    resolve = promiseResolve;
  });
  return { promise, resolve };
}

describe("useRailwayReferenceLoad", () => {
  test("reports loading, ready, and error states", async () => {
    const request = deferred<string>();
    const load = jest.fn().mockReturnValue(request.promise);
    const database = {};
    const view = await renderHook(() =>
      useRailwayReferenceLoad(database, load),
    );

    expect(view.result.current).toEqual({ status: "loading" });
    await act(async () => {
      request.resolve("ready");
      await request.promise;
    });
    expect(view.result.current).toEqual({ status: "ready", value: "ready" });

    const failedDatabase = {};
    const failedLoad = () => Promise.reject(new Error("failed"));
    const { result: failedResult } = await renderHook(() =>
      useRailwayReferenceLoad(failedDatabase, failedLoad),
    );
    await waitFor(() => {
      expect(failedResult.current).toEqual({ status: "error" });
    });
  });

  test("ignores stale results after database replacement and unmount", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const load = (database: { request: Promise<string> }) => database.request;
    const view = await renderHook(
      (database: { request: Promise<string> }) =>
        useRailwayReferenceLoad(database, load),
      { initialProps: { request: first.promise } },
    );

    await view.rerender({ request: second.promise });
    await act(async () => {
      first.resolve("stale");
      await first.promise;
    });
    expect(view.result.current).toEqual({ status: "loading" });

    await act(async () => {
      second.resolve("current");
      await second.promise;
    });
    expect(view.result.current).toEqual({
      status: "ready",
      value: "current",
    });

    const pending = deferred<string>();
    const pendingDatabase = {};
    const pendingLoad = () => pending.promise;
    const { result: unmountedResult, unmount } = await renderHook(() =>
      useRailwayReferenceLoad(pendingDatabase, pendingLoad),
    );
    await unmount();
    pending.resolve("ignored");
    await pending.promise;
    expect(unmountedResult.current).toEqual({ status: "loading" });
  });
});
