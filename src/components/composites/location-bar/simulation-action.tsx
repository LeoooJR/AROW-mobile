import { type ReactElement } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";

import PlayIcon from "@/components/composites/location-bar/play-icon";
import { simulationActionPalette } from "@/components/composites/location-bar/simulation-action-theme";

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
      <Pressable
        aria-busy={false}
        aria-label="Démarrer la simulation"
        aria-pressed={false}
        className="h-14 flex-row items-center justify-center gap-2.5 rounded-lg border-2 border-text-primary bg-primary active:bg-text-primary"
        onPress={ignoreSimulationStart}
        role="button"
        testID="simulation-play-pause"
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
      </Pressable>
    </View>
  );
}
