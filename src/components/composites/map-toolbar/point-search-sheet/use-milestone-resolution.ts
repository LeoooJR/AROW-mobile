import { useEffect, useMemo, useState } from "react";

import type { Milestone } from "@shared/railway-domain/milestone";
import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { type MilestoneResolution } from "@/features/railway-reference/search/contracts";
import { validateMilestoneInput } from "@/features/railway-reference/search/milestone-input";
import {
  milestoneLookupErrorResolution,
  unavailableMilestoneResolution,
} from "@/features/railway-reference/search/resolution-messages";
import type { Railway } from "@shared/railway-domain/railway";
import type { RailwaySection } from "@shared/railway-domain/railway-section";

interface LookupResult {
  readonly idValue: string;
  readonly resolution: MilestoneResolution;
}

interface UseMilestoneResolutionInput {
  readonly findMilestone: (id: MilestoneId) => Promise<Milestone | undefined>;
  readonly kilometer: string;
  readonly line?: Railway;
  readonly metric: string;
  readonly section?: RailwaySection;
}

export default function useMilestoneResolution({
  findMilestone,
  kilometer,
  line,
  metric,
  section,
}: UseMilestoneResolutionInput): MilestoneResolution {
  const inputResolution = validateMilestoneInput(section, kilometer, metric);
  const positionMeters =
    inputResolution.status === "ready"
      ? inputResolution.positionMeters
      : undefined;
  const lookup = useMemo<MilestoneId | undefined>(() => {
    if (
      positionMeters === undefined ||
      line === undefined ||
      section === undefined
    ) {
      return undefined;
    }

    return new MilestoneId(section.id, positionMeters);
  }, [line, positionMeters, section]);
  const idValue = lookup?.value;
  const [result, setResult] = useState<LookupResult>();

  useEffect(() => {
    if (lookup === undefined || idValue === undefined) {
      return;
    }

    const pendingLookup = lookup;
    const pendingIdValue = idValue;
    let active = true;
    async function resolve(): Promise<void> {
      try {
        const milestone = await findMilestone(pendingLookup);
        if (!active) {
          return;
        }

        setResult({
          idValue: pendingIdValue,
          resolution:
            milestone === undefined
              ? unavailableMilestoneResolution(kilometer, metric)
              : { milestone, status: "ready" },
        });
      } catch {
        if (active) {
          setResult({
            idValue: pendingIdValue,
            resolution: milestoneLookupErrorResolution(),
          });
        }
      }
    }

    void resolve();
    return () => {
      active = false;
    };
  }, [findMilestone, idValue, kilometer, lookup, metric]);

  if (inputResolution.status !== "ready") {
    return inputResolution;
  }
  if (lookup === undefined || idValue === undefined) {
    return { status: "incomplete" };
  }
  if (result?.idValue === idValue) {
    return result.resolution;
  }

  return { status: "loading" };
}
