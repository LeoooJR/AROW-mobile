import "../global.css";

import { Stack } from "expo-router";

import { GluestackUIProvider } from "@/components/adapters/gluestack-ui-provider";
import RailwayReferenceProvider from "@/features/milestones/railway-reference-provider";

export default function RootLayout() {
  return (
    <RailwayReferenceProvider>
      <GluestackUIProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </GluestackUIProvider>
    </RailwayReferenceProvider>
  );
}
