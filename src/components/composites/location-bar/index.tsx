import { type ReactElement } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CenterLocationButton from "@/components/composites/location-bar/center-location-button";
import LocationContent from "@/components/composites/location-bar/location-content";
import getLocationPresentation from "@/components/composites/location-bar/location-presentation";
import LocationRow from "@/components/composites/location-bar/location-row";
import SimulationAction from "@/components/composites/location-bar/simulation-action";
import {
  isSimulationStarted,
  type SimulationState,
} from "@/features/simulation/simulation-state";
import type {
  MockedLocationState,
  RealLocationState,
} from "@/features/real-location/real-location-state";

export interface LocationBarProps {
  readonly onLayout?: (event: LayoutChangeEvent) => void;
  readonly onAction?: () => void;
  readonly onCenter?: () => void;
  readonly onSimulationPress?: () => void;
  readonly showSimulationAction?: boolean;
  readonly simulation?: SimulationState;
  readonly state: RealLocationState | MockedLocationState;
}

export default function LocationBar({
  onLayout,
  onAction,
  onCenter,
  onSimulationPress,
  showSimulationAction = false,
  simulation,
  state,
}: LocationBarProps): ReactElement {
  const insets = useSafeAreaInsets();
  const presentation = getLocationPresentation(state, simulation);
  const hasSimulatedPosition =
    simulation !== undefined && isSimulationStarted(simulation);
  const canCenter =
    hasSimulatedPosition ||
    state.status === "connected" ||
    state.status === "mocked";
  const centerAction =
    canCenter && onCenter !== undefined ? (
      <CenterLocationButton
        locationKind={
          hasSimulatedPosition || state.status === "mocked"
            ? "simulée"
            : "réelle"
        }
        onPress={onCenter}
      />
    ) : undefined;

  return (
    <View
      onLayout={onLayout}
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
      {showSimulationAction &&
      simulation !== undefined &&
      onSimulationPress !== undefined ? (
        <SimulationAction onPress={onSimulationPress} state={simulation} />
      ) : null}
    </View>
  );
}
