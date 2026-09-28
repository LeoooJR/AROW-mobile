import { formatLocationDescriptor } from "@/utils/location-format";
import type {
  MockedLocationState,
  RealLocationState,
} from "@/hooks/platform/real-location-state";
import {
  isSimulationStarted,
  type SimulationState,
} from "@/features/simulation/simulation-state";

export interface LocationPresentation {
  readonly accessibilityLabel: string;
  readonly detail: string;
  readonly dotClassName: string;
  readonly kindLabel: string;
  readonly stateLabel: string;
}

export default function getLocationPresentation(
  state: RealLocationState | MockedLocationState,
  simulation?: SimulationState,
): LocationPresentation {
  if (simulation !== undefined && isSimulationStarted(simulation)) {
    const detail = formatLocationDescriptor(simulation.position);
    const running = simulation.status === "running";
    return {
      accessibilityLabel: `Position simulée, ${running ? "active" : "arrêt en cours"}. ${detail}`,
      detail,
      dotClassName: running ? "bg-success" : "bg-warning",
      kindLabel: "Position simulée",
      stateLabel: running ? "Active" : "Arrêt en cours",
    };
  }
  if (simulation?.status === "checking" || simulation?.status === "starting") {
    const label =
      simulation.status === "checking" ? "Vérification" : "Activation en cours";
    return {
      accessibilityLabel: `Position simulée, ${label.toLowerCase()}`,
      detail: label,
      dotClassName: "bg-warning",
      kindLabel: "Position simulée",
      stateLabel: label,
    };
  }
  if (simulation?.status === "error") {
    const messages: Record<string, string> = {
      MOCK_PROVIDER_NOT_SELECTED:
        "Sélectionnez AROW comme application de position fictive",
      LOCATION_SERVICES_DISABLED: "Activez les services de localisation",
      LOCATION_PERMISSION_REQUIRED: "Autorisez l’accès à la position",
      CLEANUP_FAILED: "Arrêt incomplet. Réessayez",
      UNSUPPORTED_PLATFORM: "Simulation disponible uniquement sur Android",
    };
    const detail =
      messages[simulation.code] ?? "Simulation indisponible. Réessayez";
    return {
      accessibilityLabel: `Simulation indisponible. ${detail}`,
      detail,
      dotClassName: "bg-error",
      kindLabel: "Position simulée",
      stateLabel: "Erreur",
    };
  }

  switch (state.status) {
    case "checking":
      return {
        accessibilityLabel: "Position réelle, vérification en cours",
        detail: "Accès à la position…",
        dotClassName: "bg-text-primary opacity-40",
        kindLabel: "Position réelle",
        stateLabel: "Vérification",
      };
    case "permissionRequired":
      return {
        accessibilityLabel:
          "Position réelle, autorisation requise. Touchez pour activer la position.",
        detail: "Touchez pour activer la position",
        dotClassName: "bg-warning",
        kindLabel: "Position réelle",
        stateLabel: "Autorisation requise",
      };
    case "requesting":
      return {
        accessibilityLabel: "Position réelle, autorisation en cours",
        detail: "Validation de l’accès…",
        dotClassName: "bg-text-primary opacity-40",
        kindLabel: "Position réelle",
        stateLabel: "Autorisation…",
      };
    case "locating":
      return {
        accessibilityLabel: "Position réelle, recherche en cours",
        detail: "Recherche de la position…",
        dotClassName: "bg-text-primary opacity-40",
        kindLabel: "Position réelle",
        stateLabel: "Connexion…",
      };
    case "connected": {
      const detail = formatLocationDescriptor(state.position);
      return {
        accessibilityLabel: `Position réelle, connectée. ${detail}`,
        detail,
        dotClassName: "bg-success",
        kindLabel: "Position réelle",
        stateLabel: "Connectée",
      };
    }
    case "mocked": {
      const detail = formatLocationDescriptor(state.position);
      return {
        accessibilityLabel: `Position simulée, active. ${detail}`,
        detail,
        dotClassName: "bg-success",
        kindLabel: "Position simulée",
        stateLabel: "Active",
      };
    }
    case "servicesDisabled":
      return {
        accessibilityLabel:
          "Position réelle, services de localisation désactivés. Touchez pour réessayer.",
        detail: "Touchez pour réessayer",
        dotClassName: "bg-error",
        kindLabel: "Position réelle",
        stateLabel: "Services désactivés",
      };
    case "denied":
      return state.canAskAgain
        ? {
            accessibilityLabel:
              "Position réelle, accès refusé. Touchez pour autoriser.",
            detail: "Touchez pour autoriser",
            dotClassName: "bg-error",
            kindLabel: "Position réelle",
            stateLabel: "Accès refusé",
          }
        : {
            accessibilityLabel:
              "Position réelle, accès bloqué. Touchez pour ouvrir les réglages.",
            detail: "Touchez pour ouvrir les réglages",
            dotClassName: "bg-error",
            kindLabel: "Position réelle",
            stateLabel: "Accès bloqué",
          };
    case "error":
      return {
        accessibilityLabel:
          "Position réelle indisponible. Touchez pour réessayer.",
        detail: "Touchez pour réessayer",
        dotClassName: "bg-error",
        kindLabel: "Position réelle",
        stateLabel: "Indisponible",
      };
  }
}
