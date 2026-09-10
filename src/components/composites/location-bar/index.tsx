import { type ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CenterLocationButton from "@/components/composites/location-bar/center-location-button";
import LocationContent from "@/components/composites/location-bar/location-content";
import getLocationPresentation from "@/components/composites/location-bar/location-presentation";
import LocationRow from "@/components/composites/location-bar/location-row";
import SimulationAction from "@/components/composites/location-bar/simulation-action";
import type {
  MockedLocationState,
  RealLocationState,
} from "@/hooks/platform/use-real-location";

export interface LocationBarProps {
  readonly onAction?: () => void;
  readonly onCenter?: () => void;
  readonly showSimulationAction?: boolean;
  readonly state: RealLocationState | MockedLocationState;
}

export default function LocationBar({
  onAction,
  onCenter,
  showSimulationAction = false,
  state,
}: LocationBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const presentation = getLocationPresentation(state);
  const canCenter = state.status === "connected" || state.status === "mocked";
  const centerAction =
    canCenter && onCenter !== undefined ? (
      <CenterLocationButton
        locationKind={state.status === "mocked" ? "simulée" : "réelle"}
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
      {showSimulationAction ? <SimulationAction /> : null}
    </View>
  );
}
