import { type ReactElement, type ReactNode } from "react";
import {
  Pressable,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import type {
  LocationPosition,
  MockedLocationState,
  RealLocationState,
} from "@/hooks/platform/use-real-location";

export interface LocationBarProps {
  readonly onAction?: () => void;
  readonly onCenter?: () => void;
  readonly state: RealLocationState | MockedLocationState;
}

interface LocationPresentation {
  readonly accessibilityLabel: string;
  readonly detail: string;
  readonly dotClassName: string;
  readonly kindLabel: string;
  readonly stateLabel: string;
}

const CENTER_ICON_COLORS = {
  dark: "#FAF9F6",
  light: "#0A0A0A",
} as const;

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

function getPresentation(
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
            {presentation.kindLabel}
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
  action,
  accessibilityLabel,
  children,
  onAction,
}: {
  readonly action?: ReactNode;
  readonly accessibilityLabel: string;
  readonly children: ReactNode;
  readonly onAction?: () => void;
}): ReactElement {
  const className = "min-h-[70px] flex-row items-center gap-3 py-2";

  if (onAction === undefined) {
    return (
      <View className={className}>
        <View
          accessible
          accessibilityLabel={accessibilityLabel}
          accessibilityLiveRegion="polite"
          className="min-w-0 flex-1 flex-row items-center gap-3"
          testID="location-status"
        >
          {children}
        </View>
        {action}
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
      testID="location-status"
    >
      {children}
    </Pressable>
  );
}

function CenterButton({
  accessibilityLabel,
  color,
  compact,
  onPress,
}: {
  readonly accessibilityLabel: string;
  readonly color: string;
  readonly compact: boolean;
  readonly onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={`h-12 flex-row items-center justify-center gap-[5px] rounded-lg bg-transparent active:bg-surface-muted ${compact ? "min-w-12 px-0" : "min-w-16 px-2"}`}
      hitSlop={4}
      onPress={onPress}
      testID="center-location"
    >
      <Svg height={18} viewBox="0 0 24 24" width={18}>
        <Circle
          cx={12}
          cy={12}
          fill="none"
          r={4}
          stroke={color}
          strokeWidth={1.8}
        />
        <Path
          d="M12 2v3m0 14v3M2 12h3m14 0h3"
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth={1.8}
        />
      </Svg>
      {compact ? null : (
        <Text className="text-[11px] font-semibold leading-[15px] text-text-primary">
          Centrer
        </Text>
      )}
    </Pressable>
  );
}

export default function LocationBar({
  onAction,
  onCenter,
  state,
}: LocationBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const presentation = getPresentation(state);
  const canCenter = state.status === "connected" || state.status === "mocked";
  const centerAction =
    canCenter && onCenter !== undefined ? (
      <CenterButton
        accessibilityLabel={`Centrer la carte sur la position ${state.status === "mocked" ? "simulée" : "réelle"}`}
        color={
          colorScheme === "dark"
            ? CENTER_ICON_COLORS.dark
            : CENTER_ICON_COLORS.light
        }
        compact={width <= 380}
        onPress={onCenter}
      />
    ) : undefined;

  return (
    <View
      className="absolute inset-x-0 bottom-0 border-t border-border-subtle bg-canvas px-4"
      style={{ paddingBottom: Math.max(10, insets.bottom) }}
    >
      <LocationRow
        action={centerAction}
        accessibilityLabel={presentation.accessibilityLabel}
        onAction={onAction}
      >
        <LocationContent presentation={presentation} />
      </LocationRow>
    </View>
  );
}
