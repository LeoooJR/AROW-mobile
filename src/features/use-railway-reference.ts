import { useContext } from "react";

import {
  RailwayReferenceContext,
  type RailwayReferenceModel,
} from "@/features/railway-reference/context";

export function useRailwayReference(): RailwayReferenceModel {
  const value = useContext(RailwayReferenceContext);
  if (value === undefined) {
    throw new Error(
      "useRailwayReference must be used within RailwayReferenceProvider",
    );
  }
  return value;
}
