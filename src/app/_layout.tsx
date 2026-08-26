import "../global.css";

import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { GluestackUIProvider } from "@/components/adapters/gluestack-ui-provider";
import milestoneDatabaseAsset from "@/statics/pk.sqlite";

export default function RootLayout() {
  return (
    <SQLiteProvider
      assetSource={{ assetId: milestoneDatabaseAsset }}
      databaseName="pk-v1.sqlite"
    >
      <GluestackUIProvider>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
      </GluestackUIProvider>
    </SQLiteProvider>
  );
}
