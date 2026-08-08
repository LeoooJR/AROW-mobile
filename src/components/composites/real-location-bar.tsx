import { type ReactElement, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type {
  RealLocationPosition,
  RealLocationState,
} from "@/hooks/platform/use-real-location";

export interface RealLocationBarProps {
  readonly onAction?: () => void;
  readonly state: RealLocationState;
}

interface LocationPresentation {
  readonly accessibilityLabel: string;
  readonly detail: string;
  readonly dotClassName: string;
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

function formatPosition(position: RealLocationPosition): string {
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

function getPresentation(state: RealLocationState): LocationPresentation {
  switch (state.status) {
    case "checking":
      return {
        accessibilityLabel: "Position réelle, vérification en cours",
        detail: "Accès à la position…",
        dotClassName: "bg-text-primary opacity-40",
        stateLabel: "Vérification",
      };
    case "permissionRequired":
      return {
        accessibilityLabel:
          "Position réelle, autorisation requise. Touchez pour activer la position.",
        detail: "Touchez pour activer la position",
        dotClassName: "bg-warning",
        stateLabel: "Autorisation requise",
      };
    case "requesting":
      return {
        accessibilityLabel: "Position réelle, autorisation en cours",
        detail: "Validation de l’accès…",
        dotClassName: "bg-text-primary opacity-40",
        stateLabel: "Autorisation…",
      };
    case "locating":
      return {
        accessibilityLabel: "Position réelle, recherche en cours",
        detail: "Recherche de la position…",
        dotClassName: "bg-text-primary opacity-40",
        stateLabel: "Connexion…",
      };
    case "connected": {
      const detail = formatPosition(state.position);
      return {
        accessibilityLabel: `Position réelle, connectée. ${detail}`,
        detail,
        dotClassName: "bg-success",
        stateLabel: "Connectée",
      };
    }
    case "mocked": {
      const detail = formatPosition(state.position);
      return {
        accessibilityLabel: `Position réelle, signal simulé. ${detail}`,
        detail,
        dotClassName: "bg-warning",
        stateLabel: "Signal simulé",
      };
    }
    case "servicesDisabled":
      return {
        accessibilityLabel:
          "Position réelle, services de localisation désactivés. Touchez pour réessayer.",
        detail: "Touchez pour réessayer",
        dotClassName: "bg-error",
        stateLabel: "Services désactivés",
      };
    case "denied":
      return state.canAskAgain
        ? {
            accessibilityLabel:
              "Position réelle, accès refusé. Touchez pour autoriser.",
            detail: "Touchez pour autoriser",
            dotClassName: "bg-error",
            stateLabel: "Accès refusé",
          }
        : {
            accessibilityLabel:
              "Position réelle, accès bloqué. Touchez pour ouvrir les réglages.",
            detail: "Touchez pour ouvrir les réglages",
            dotClassName: "bg-error",
            stateLabel: "Accès bloqué",
          };
    case "error":
      return {
        accessibilityLabel:
          "Position réelle indisponible. Touchez pour réessayer.",
        detail: "Touchez pour réessayer",
        dotClassName: "bg-error",
        stateLabel: "Indisponible",
      };
  }
}

function LocationContent({
  presentation,
}: {
  readonly presentation: LocationPresentation;
}): ReactElement {
  return (
    <>
      <View
        className={`size-2 shrink-0 rounded-full ${presentation.dotClassName}`}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row flex-wrap items-baseline gap-x-2">
          <Text className="text-[13px] font-semibold leading-[18px] text-text-primary">
            Position réelle
          </Text>
          <Text className="text-[11px] leading-[15px] text-text-muted">
            {presentation.stateLabel}
          </Text>
        </View>
        <Text
          className="mt-1 font-mono text-[11px] leading-[17px] text-text-muted"
          selectable
        >
          {presentation.detail}
        </Text>
      </View>
    </>
  );
}

function LocationRow({
  accessibilityLabel,
  children,
  onAction,
}: {
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onAction?: () => void;
}): ReactElement {
  const className = "min-h-[70px] flex-row items-center gap-3 py-2";

  if (onAction === undefined) {
    return (
      <View
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityLiveRegion="polite"
        className={className}
      >
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion="polite"
      accessibilityRole="button"
      className={`${className} bg-canvas active:bg-surface-muted`}
      onPress={onAction}
    >
      {children}
    </Pressable>
  );
}

export default function RealLocationBar({
  onAction,
  state,
}: RealLocationBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const presentation = getPresentation(state);

  return (
    <View
      className="absolute inset-x-0 bottom-0 border-t border-border-subtle bg-canvas px-4"
      style={{ paddingBottom: Math.max(10, insets.bottom) }}
    >
      <LocationRow
        accessibilityLabel={presentation.accessibilityLabel}
        onAction={onAction}
      >
        <LocationContent presentation={presentation} />
      </LocationRow>
    </View>
  );
}
