import "../global.css";

import { Stack } from "expo-router";

import { GluestackUIProvider } from "@/components/adapters/gluestack-ui-provider";
import MilestoneDatabaseProvider from "@/features/milestones/milestone-database-provider";

export default function RootLayout() {
  return (
    <MilestoneDatabaseProvider>
      <GluestackUIProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </GluestackUIProvider>
    </MilestoneDatabaseProvider>
  );
}
