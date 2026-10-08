import "../global.css";

import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";

import { GluestackUIProvider } from "@/components/adapters/gluestack-ui-provider";
import SimulationNotificationWarning from "@/components/composites/simulation-notification-warning";
import StartupScreen from "@/components/composites/startup-screen";
import { AppStartupContext } from "@/features/app-startup/context";
import { useAppStartup } from "@/hooks/platform/use-app-startup";
import RailwayReferenceProvider from "@/features/railway-reference/provider";
import SimulationProvider from "@/features/simulation/simulation-provider";

if (process.env.EXPO_OS !== "web") {
  void SplashScreen.preventAutoHideAsync().catch(console.warn);
}

export default function RootLayout() {
  const startup = useAppStartup();
  return (
    <AppStartupContext.Provider value={startup}>
      <View className="flex-1" onLayout={startup.onLayout}>
        <View
          className="flex-1"
          importantForAccessibility={
            startup.status === "ready" ? "auto" : "no-hide-descendants"
          }
          accessibilityElementsHidden={startup.status !== "ready"}
        >
          <SimulationProvider>
            <RailwayReferenceProvider
              key={startup.attempt}
              onError={startup.onFailure}
            >
              <GluestackUIProvider>
                <SimulationNotificationWarning />
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                </Stack>
              </GluestackUIProvider>
            </RailwayReferenceProvider>
          </SimulationProvider>
        </View>
        {startup.status !== "ready" ? (
          <StartupScreen
            key={`startup-${startup.status}`}
            failed={startup.status === "error"}
            onLayout={startup.onFallbackLayout}
            onRetry={startup.retry}
            showProgress={startup.attempt > 0}
            onArtworkReady={startup.onArtworkReady}
          />
        ) : null}
      </View>
    </AppStartupContext.Provider>
  );
}
