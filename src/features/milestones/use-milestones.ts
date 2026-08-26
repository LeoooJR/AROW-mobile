import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";

import {
  milestoneRowsToFeatureCollection,
  type MilestoneState,
} from "./milestones";

const MILESTONE_QUERY = `
  SELECT ligne, code_ligne, km, label, rg_troncon, latitude, longitude
  FROM kilometric_points
`;

export function useMilestones(): MilestoneState {
  const database = useSQLiteContext();
  const [state, setState] = useState<MilestoneState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    async function loadMilestones(): Promise<void> {
      try {
        const rows = await database.getAllAsync<unknown>(MILESTONE_QUERY);
        const collection = milestoneRowsToFeatureCollection(rows);

        if (active) {
          setState({ collection, status: "ready" });
        }
      } catch {
        if (active) {
          setState({ status: "error" });
        }
      }
    }

    void loadMilestones();

    return () => {
      active = false;
    };
  }, [database]);

  return state;
}
