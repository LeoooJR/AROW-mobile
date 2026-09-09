import { useEffect, useState } from "react";

export type RailwayReferenceLoadState<Value> =
  | { readonly status: "loading" }
  | { readonly value: Value; readonly status: "ready" }
  | { readonly status: "error" };

interface LoadSnapshot<Database, Value> {
  readonly database: Database;
  readonly load: (database: Database) => Promise<Value>;
  readonly state: RailwayReferenceLoadState<Value>;
}

export default function useRailwayReferenceLoad<Database, Value>(
  database: Database,
  load: (database: Database) => Promise<Value>,
): RailwayReferenceLoadState<Value> {
  const [snapshot, setSnapshot] = useState<LoadSnapshot<Database, Value>>({
    database,
    load,
    state: { status: "loading" },
  });

  useEffect(() => {
    let active = true;
    void load(database).then(
      (value) => {
        if (active) {
          setSnapshot({
            database,
            load,
            state: { status: "ready", value },
          });
        }
      },
      () => {
        if (active) {
          setSnapshot({ database, load, state: { status: "error" } });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [database, load]);

  return snapshot.database === database && snapshot.load === load
    ? snapshot.state
    : { status: "loading" };
}
