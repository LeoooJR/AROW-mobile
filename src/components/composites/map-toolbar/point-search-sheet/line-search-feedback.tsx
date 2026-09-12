import { type ReactElement } from "react";
import { Text } from "react-native";

import LineSearchStatusMessage from "@/components/composites/map-toolbar/point-search-sheet/line-search-status-message";
import type { MilestoneSearchState } from "@/features/milestones/milestone-search";

interface LineSearchFeedbackProps {
  readonly hasResults: boolean;
  readonly queryReady: boolean;
  readonly searchState: MilestoneSearchState;
}

export default function LineSearchFeedback({
  hasResults,
  queryReady,
  searchState,
}: LineSearchFeedbackProps): ReactElement | null {
  switch (searchState.status) {
    case "loading":
      return (
        <LineSearchStatusMessage>
          Chargement du référentiel ferroviaire…
        </LineSearchStatusMessage>
      );
    case "error":
    case "unavailable":
      return (
        <Text
          className="mt-2 rounded-lg border border-border-subtle bg-surface p-2.5 text-xs font-semibold text-error"
          role="alert"
        >
          Référentiel ferroviaire indisponible.
        </Text>
      );
    case "ready":
      break;
  }

  if (!queryReady) {
    return (
      <LineSearchStatusMessage>
        Recherchez une ligne pour afficher les correspondances.
      </LineSearchStatusMessage>
    );
  }

  if (!hasResults) {
    return (
      <LineSearchStatusMessage>
        Aucune ligne trouvée. Vérifiez le nom ou le code unique.
      </LineSearchStatusMessage>
    );
  }

  return null;
}
