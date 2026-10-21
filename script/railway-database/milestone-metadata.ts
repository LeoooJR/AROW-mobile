import { RailwaySectionId } from "../../shared/railway-domain/railway-section-id";
import type { KilometricPointDatabaseRow } from "../../shared/railway-reference/records";
import type { Milestone } from "./types";

export function milestoneRowsBySection(
  milestones: readonly Milestone[],
): ReadonlyMap<string, readonly KilometricPointDatabaseRow[]> {
  const groups = new Map<string, Milestone[]>();
  for (const milestone of milestones) {
    const id = new RailwaySectionId(milestone.code, milestone.rank).value;
    const group = groups.get(id) ?? [];
    group.push(milestone);
    groups.set(id, group);
  }

  return new Map(
    [...groups].map(([id, group]) => [
      id,
      group
        .sort((left, right) => left.positionMeters - right.positionMeters)
        .map((milestone, index) => ({
          code_ligne: milestone.code,
          label: milestone.label,
          latitude: milestone.latitude,
          longitude: milestone.longitude,
          position_in_section: index + 1,
          position_m: milestone.positionMeters,
          rg_troncon: milestone.rank,
        })),
    ]),
  );
}
