import { type ReactElement } from "react";
import { Text, useColorScheme, View } from "react-native";

import { simulationActionPalette } from "@/components/composites/location-bar/simulation-action-theme";
import Button from "@/components/primitives/button";
import PlayIcon from "@/components/primitives/icons/play-icon";

export const SIMULATION_ACTION_OCCUPIED_HEIGHT = 67;

function ignoreSimulationStart(): void {
  return undefined;
}

export default function SimulationAction(): ReactElement {
  const palette = simulationActionPalette(useColorScheme());

  return (
    <View
      className="border-t border-border-subtle pt-2.5"
      testID="simulation-primary-action"
    >
      <Button
        aria-busy={false}
        aria-label="Démarrer la simulation"
        aria-pressed={false}
        className="flex-row gap-2.5"
        onPress={ignoreSimulationStart}
        role="button"
        size="toolbar"
        testID="simulation-play-pause"
        variant="accent"
      >
        {({ pressed }) => {
          const foreground = pressed
            ? palette.pressedForeground
            : palette.foreground;
          return (
            <>
              <PlayIcon color={foreground} />
              <Text
                className="text-sm font-bold leading-[18px]"
                style={{ color: foreground }}
              >
                Démarrer la simulation
              </Text>
            </>
          );
        }}
      </Button>
    </View>
  );
}
