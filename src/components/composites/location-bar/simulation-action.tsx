import { type ReactElement } from "react";
import { ActivityIndicator, Text, useColorScheme, View } from "react-native";

import { simulationActionPalette } from "@/components/composites/location-bar/simulation-action-theme";
import Button from "@/components/primitives/button";
import PlayIcon from "@/components/primitives/icons/play-icon";
import StopIcon from "@/components/primitives/icons/stop-icon";
import {
  isSimulationBusy,
  isSimulationStopRequired,
  type SimulationState,
} from "@/features/simulation/simulation-state";

export const SIMULATION_ACTION_OCCUPIED_HEIGHT = 67;

export interface SimulationActionProps {
  readonly onPress: () => void;
  readonly state: SimulationState;
}

export default function SimulationAction({
  onPress,
  state,
}: SimulationActionProps): ReactElement {
  const palette = simulationActionPalette(useColorScheme());
  const busy = isSimulationBusy(state);
  const stopping = isSimulationStopRequired(state);
  const label =
    state.status === "checking"
      ? "Vérification en cours"
      : state.status === "starting"
        ? "Activation en cours"
        : state.status === "stopping"
          ? "Arrêt en cours"
          : state.status === "running"
            ? "Arrêter la simulation"
            : state.status === "error"
              ? stopping
                ? "Réessayer l’arrêt"
                : "Réessayer la simulation"
              : "Démarrer la simulation";

  return (
    <View
      className="border-t border-border-subtle pt-2.5"
      testID="simulation-primary-action"
    >
      <Button
        aria-busy={busy}
        aria-label={label}
        aria-pressed={stopping}
        className={`flex-row gap-2.5 ${busy ? "bg-text-primary" : ""}`}
        disabled={busy}
        onPress={onPress}
        role="button"
        size="toolbar"
        testID="simulation-play-pause"
        variant="accent"
      >
        {({ pressed }) => {
          const foreground =
            pressed || busy ? palette.pressedForeground : palette.foreground;
          return (
            <>
              {busy ? (
                <ActivityIndicator color={foreground} size="small" />
              ) : stopping ? (
                <StopIcon color={foreground} />
              ) : (
                <PlayIcon color={foreground} />
              )}
              <Text
                className="text-sm font-bold leading-[18px]"
                style={{ color: foreground }}
              >
                {label}
              </Text>
            </>
          );
        }}
      </Button>
    </View>
  );
}
