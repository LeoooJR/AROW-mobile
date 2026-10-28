import { useCallback, useEffect, useRef, useState } from "react";

type LookupState<T> =
  | { readonly status: "loading" | "error" }
  | { readonly status: "ready"; readonly data: T };

export function useSelectionLookup<Id extends { readonly value: string }, T>(
  id: Id | undefined,
  find: (id: Id) => Promise<T>,
  onFailure: () => void,
) {
  const [result, setResult] = useState<{
    readonly id: string;
    readonly state: LookupState<T>;
  }>();
  const pending = useRef<object | undefined>(undefined);
  const load = useCallback(
    async (onReady?: (data: T) => void) => {
      if (id === undefined || pending.current !== undefined) return;
      const request = {};
      pending.current = request;
      setResult({ id: id.value, state: { status: "loading" } });
      try {
        const data = await find(id);
        if (pending.current !== request) return;
        setResult({ id: id.value, state: { status: "ready", data } });
        onReady?.(data);
      } catch {
        if (pending.current !== request) return;
        setResult({ id: id.value, state: { status: "error" } });
        onFailure();
      } finally {
        if (pending.current === request) pending.current = undefined;
      }
    },
    [id, find, onFailure],
  );

  useEffect(() => {
    let active = true;
    const operation = pending;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
      operation.current = undefined;
    };
  }, [load]);

  const state: LookupState<T> =
    id !== undefined && result?.id === id.value
      ? result.state
      : { status: "loading" };
  const run = (onReady: (data: T) => void) => {
    if (pending.current !== undefined) return;
    if (state.status === "error") void load(onReady);
    else if (state.status === "ready") onReady(state.data);
  };
  return { state, run };
}
