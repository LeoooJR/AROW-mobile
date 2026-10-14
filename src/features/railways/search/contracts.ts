import type { Railway } from "@/features/railways/domain/railway";

export type RailwaySearchState =
  | { readonly status: "idle" }
  | { readonly status: "loading" }
  | { readonly status: "unavailable" }
  | { readonly status: "error" }
  | {
      readonly railways: readonly Railway[];
      readonly status: "ready";
    };
