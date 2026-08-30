import { type ReactElement } from "react";
import {
  Pressable,
  Text,
  useColorScheme,
  useWindowDimensions,
  type ViewStyle,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

const ICON_COLORS = {
  dark: "#FAF9F6",
  light: "#0A0A0A",
} as const;

const SHADOW_COLORS = {
  dark: "#10100F",
  light: "#E7E7E2",
} as const;

function noOp(): void {}

function SearchIcon({ color }: { readonly color: string }): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Circle
        cx={11}
        cy={11}
        fill="none"
        r={6}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M16 16l4 4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Svg>
  );
}

function LayersIcon({ color }: { readonly color: string }): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="M12 4l8 4-8 4-8-4 8-4Zm-8 9 8 4 8-4M4 17l8 4 8-4"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function MapFocusIcon({ color }: { readonly color: string }): ReactElement {
  return (
    <Svg height={22} viewBox="0 0 24 24" width={22}>
      <Path
        d="M9 4H4v5M15 4h5v5M9 20H4v-5m11 5h5v-5"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
      />
    </Svg>
  );
}

export default function MapToolbar(): ReactElement {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const theme = colorScheme === "dark" ? "dark" : "light";
  const compact = width <= 380;
  const buttonStyle = {
    borderCurve: "continuous",
    boxShadow: `0 4px 12px ${SHADOW_COLORS[theme]}`,
  } satisfies ViewStyle;

  return (
    <View
      aria-label="Recherche cartographique"
      className={`absolute z-20 flex-row items-start ${compact ? "inset-x-3 gap-2" : "inset-x-4 gap-2.5"}`}
      pointerEvents="box-none"
      style={{ top: Math.max(16, insets.top) }}
      testID="map-toolbar"
    >
      <Pressable
        className={`h-14 min-w-0 flex-1 flex-row items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted ${compact ? "gap-2.5 px-2.5" : "gap-2.5 px-4"}`}
        onPress={noOp}
        role="button"
        style={buttonStyle}
        testID="open-point-search"
      >
        <SearchIcon color={ICON_COLORS[theme]} />
        <Text
          className={`${compact ? "text-sm" : "text-[15px]"} font-semibold leading-5 text-text-primary`}
        >
          Rechercher un point
        </Text>
      </Pressable>
      <Pressable
        aria-label="Afficher les couches de la carte"
        className="size-14 items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted"
        onPress={noOp}
        role="button"
        style={buttonStyle}
        testID="map-layers-button"
      >
        <LayersIcon color={ICON_COLORS[theme]} />
      </Pressable>
      <Pressable
        aria-label="Activer le mode carte seule"
        aria-pressed={false}
        className="size-14 items-center justify-center rounded-lg border border-border-subtle bg-canvas active:bg-surface-muted"
        onPress={noOp}
        role="button"
        style={buttonStyle}
        testID="map-focus-button"
      >
        <MapFocusIcon color={ICON_COLORS[theme]} />
      </Pressable>
    </View>
  );
}
