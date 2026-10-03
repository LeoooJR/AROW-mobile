import "../global.css";

import { Stack } from "expo-router";

import { GluestackUIProvider } from "@/components/adapters/gluestack-ui-provider";
import SimulationNotificationWarning from "@/components/composites/simulation-notification-warning";
import RailwayReferenceProvider from "@/features/railway-reference/provider";
import SimulationProvider from "@/features/simulation/simulation-provider";

export default function RootLayout() {
  return (
    <SimulationProvider>
      <RailwayReferenceProvider>
        <GluestackUIProvider>
          <SimulationNotificationWarning />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </GluestackUIProvider>
      </RailwayReferenceProvider>
    </SimulationProvider>
  );
}
