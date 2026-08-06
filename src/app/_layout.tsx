import "../global.css";

import { Stack } from "expo-router";

import { GluestackUIProvider } from "@/components/adapters/gluestack-ui-provider";

export default function RootLayout() {
  return (
    <GluestackUIProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </GluestackUIProvider>
  );
}
