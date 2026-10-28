import type {
  MilestoneInputResolution,
  MilestoneResolution,
} from "@/features/railway-reference/search/contracts";
import type { RailwayMilestoneRange } from "@shared/railway-domain/railway-milestone-range";

export function outOfRangeMilestoneResolution(
  range: RailwayMilestoneRange,
): MilestoneInputResolution {
  return {
    message: `Repère hors section. Saisissez une valeur entre ${range.minimumLabel} et ${range.maximumLabel}.`,
    status: "error",
  };
}

export function unavailableMilestoneResolution(
  kilometerInput: string,
  metricInput: string,
): MilestoneResolution {
  return {
    message: `Le repère ${kilometerInput}+${metricInput} n’est pas disponible dans cette section.`,
    status: "error",
  };
}

export function milestoneLookupErrorResolution(): MilestoneResolution {
  return {
    message: "La recherche de ce repère est momentanément indisponible.",
    status: "error",
  };
}
