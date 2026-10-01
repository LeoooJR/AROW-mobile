import type { LocationDescriptor } from "@/types/location-descriptor";

export type RealLocationState =
  | { readonly status: "checking" }
  | { readonly status: "permissionRequired" }
  | { readonly status: "requesting" }
  | { readonly status: "locating"; readonly position?: LocationDescriptor }
  | { readonly status: "connected"; readonly position: LocationDescriptor }
  | { readonly status: "servicesDisabled" }
  | { readonly status: "denied"; readonly canAskAgain: boolean }
  | { readonly status: "error" };

export interface MockedLocationState {
  readonly status: "mocked";
  readonly position: LocationDescriptor;
}

export type LocationState = RealLocationState | MockedLocationState;

export function getRetainedPosition(
  state: LocationState,
): LocationDescriptor | undefined {
  return state.status === "connected" ||
    state.status === "mocked" ||
    state.status === "locating"
    ? state.position
    : undefined;
}
