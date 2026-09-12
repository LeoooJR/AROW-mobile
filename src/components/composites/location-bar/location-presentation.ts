import type {
  LocationPosition,
  MockedLocationState,
  RealLocationState,
} from "@/hooks/platform/use-real-location";

export interface LocationPresentation {
  readonly accessibilityLabel: string;
  readonly detail: string;
  readonly dotClassName: string;
  readonly kindLabel: string;
  readonly stateLabel: string;
}

function formatCoordinate(
  value: number,
  positiveHemisphere: string,
  negativeHemisphere: string,
): string {
  const hemisphere = value >= 0 ? positiveHemisphere : negativeHemisphere;
  return `${Math.abs(value).toFixed(5)} ${hemisphere}`;
}

function formatPosition(position: LocationPosition): string {
  const coordinates = [
    formatCoordinate(position.latitude, "N", "S"),
    formatCoordinate(position.longitude, "E", "O"),
  ].join(" · ");
  const accuracy =
    position.accuracy === null
      ? "précision indisponible"
      : `précision ${Math.max(0, Math.round(position.accuracy))} m`;

  return `${coordinates} · ${accuracy}`;
}

export default function getLocationPresentation(
  state: RealLocationState | MockedLocationState,
): LocationPresentation {
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
      const detail = formatPosition(state.position);
      return {
        accessibilityLabel: `Position réelle, connectée. ${detail}`,
        detail,
        dotClassName: "bg-success",
        kindLabel: "Position réelle",
        stateLabel: "Connectée",
      };
    }
    case "mocked": {
      const detail = formatPosition(state.position);
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
