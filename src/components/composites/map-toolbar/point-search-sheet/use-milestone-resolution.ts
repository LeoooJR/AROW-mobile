import { useEffect, useMemo, useState } from "react";

import type { Milestone } from "@/features/milestones/milestone";
import {
  type MilestoneLookupInput,
  type MilestoneResolution,
  validateMilestoneInput,
} from "@/features/milestones/milestone-search";
import {
  milestoneLookupErrorResolution,
  unavailableMilestoneResolution,
} from "@/features/milestones/milestone-search-messages";
import type { Railway } from "@/features/railways/railway";
import type { RailwaySection } from "@/features/railways/railway-section";

interface LookupResult {
  readonly key: string;
  readonly resolution: MilestoneResolution;
}

interface UseMilestoneResolutionInput {
  readonly findMilestone: (
    input: MilestoneLookupInput,
  ) => Promise<Milestone | undefined>;
  readonly kilometer: string;
  readonly line?: Railway;
  readonly metric: string;
  readonly section?: RailwaySection;
}

function lookupKey(input: MilestoneLookupInput): string {
  return `${input.lineCode}:${input.sectionRank}:${input.positionMeters}`;
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
  const lookup = useMemo<MilestoneLookupInput | undefined>(() => {
    if (
      positionMeters === undefined ||
      line === undefined ||
      section === undefined
    ) {
      return undefined;
    }

    return {
      lineCode: line.code,
      positionMeters,
      sectionRank: section.sectionRank,
    };
  }, [line, positionMeters, section]);
  const key = lookup === undefined ? undefined : lookupKey(lookup);
  const [result, setResult] = useState<LookupResult>();

  useEffect(() => {
    if (lookup === undefined || key === undefined) {
      return;
    }

    const pendingLookup = lookup;
    const pendingKey = key;
    let active = true;
    async function resolve(): Promise<void> {
      try {
        const milestone = await findMilestone(pendingLookup);
        if (!active) {
          return;
        }

        setResult({
          key: pendingKey,
          resolution:
            milestone === undefined
              ? unavailableMilestoneResolution(kilometer, metric)
              : { milestone, status: "ready" },
        });
      } catch {
        if (active) {
          setResult({
            key: pendingKey,
            resolution: milestoneLookupErrorResolution(),
          });
        }
      }
    }

    void resolve();
    return () => {
      active = false;
    };
  }, [findMilestone, key, kilometer, lookup, metric]);

  if (inputResolution.status !== "ready") {
    return inputResolution;
  }
  if (lookup === undefined || key === undefined) {
    return { status: "incomplete" };
  }
  if (result?.key === key) {
    return result.resolution;
  }

  return { status: "loading" };
}
