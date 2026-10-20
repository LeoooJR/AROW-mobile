import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useSelectionLookup } from "./use-selection-lookup";

const first = { value: "first" };
const second = { value: "second" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((accept, fail) => {
    resolve = accept;
    reject = fail;
  });
  return { promise, resolve, reject };
}

test("loads the selection once and runs repeated actions only when ready", async () => {
  const request = deferred<number>();
  const find = jest.fn(() => request.promise);
  const action = jest.fn(),
    fail = jest.fn();
  const { result } = await renderHook(() =>
    useSelectionLookup(first, find, fail),
  );
  expect(result.current.state).toEqual({ status: "loading" });
  await act(async () => result.current.run(action));
  expect(action).not.toHaveBeenCalled();
  expect(find.mock.calls).toEqual([[first]]);
  await act(async () => request.resolve(42));
  expect(result.current.state).toEqual({ status: "ready", data: 42 });
  await act(async () => {
    result.current.run(action);
    result.current.run(action);
  });
  expect(action.mock.calls).toEqual([[42], [42]]);
  expect(find).toHaveBeenCalledTimes(1);
  expect(fail).not.toHaveBeenCalled();
});

test("retries once and runs only the first requested action after success", async () => {
  const request = deferred<number>();
  const find = jest
    .fn()
    .mockRejectedValueOnce(Error("offline"))
    .mockReturnValueOnce(request.promise);
  const action = jest.fn(),
    duplicate = jest.fn(),
    fail = jest.fn();
  const { result } = await renderHook(() =>
    useSelectionLookup(first, find, fail),
  );
  await waitFor(() => expect(result.current.state.status).toBe("error"));
  expect(fail).toHaveBeenCalledTimes(1);
  await act(async () => {
    result.current.run(action);
    result.current.run(duplicate);
  });
  expect(result.current.state).toEqual({ status: "loading" });
  expect(find).toHaveBeenCalledTimes(2);
  await act(async () => request.resolve(42));
  expect(action.mock.calls).toEqual([[42]]);
  expect(duplicate).not.toHaveBeenCalled();
});

describe.each(["replace", "close", "unmount"] as const)(
  "selection lifecycle: %s",
  (change) => {
    test.each(["success", "failure"] as const)(
      "ignores stale retry %s without affecting a newer request",
      async (outcome) => {
        const stale = deferred<number>(),
          current = deferred<number>();
        const find = jest
          .fn()
          .mockRejectedValueOnce(Error("offline"))
          .mockReturnValueOnce(stale.promise)
          .mockReturnValueOnce(current.promise);
        const action = jest.fn(),
          fail = jest.fn();
        const { result, rerender, unmount } = await renderHook(
          ({ id }: { id: typeof first | undefined }) =>
            useSelectionLookup(id, find, fail),
          { initialProps: { id: first as typeof first | undefined } },
        );
        await waitFor(() => expect(result.current.state.status).toBe("error"));
        await act(async () => result.current.run(action));
        if (change === "unmount") await unmount();
        else await rerender({ id: change === "replace" ? second : undefined });
        await act(async () => {
          if (outcome === "success") stale.resolve(1);
          else stale.reject(Error("late failure"));
        });
        expect(action).not.toHaveBeenCalled();
        expect(fail).toHaveBeenCalledTimes(1);
        if (change === "replace") {
          expect(result.current.state).toEqual({ status: "loading" });
          await act(async () => current.resolve(2));
          expect(result.current.state).toEqual({ status: "ready", data: 2 });
        }
      },
    );
  },
);

test("does not query an absent selection and accepts an unavailable result", async () => {
  const find = jest.fn().mockResolvedValue(undefined),
    fail = jest.fn();
  const action = jest.fn();
  const { result, rerender } = await renderHook(
    ({ id }: { id: typeof first | undefined }) =>
      useSelectionLookup(id, find, fail),
    { initialProps: { id: undefined as typeof first | undefined } },
  );
  await act(async () => result.current.run(action));
  expect(find).not.toHaveBeenCalled();
  expect(action).not.toHaveBeenCalled();
  await rerender({ id: first });
  await waitFor(() => expect(result.current.state.status).toBe("ready"));
  await act(async () => result.current.run(action));
  expect(action.mock.calls).toEqual([[undefined]]);
  expect(fail).not.toHaveBeenCalled();
});
