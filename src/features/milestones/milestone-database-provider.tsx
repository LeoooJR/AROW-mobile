import { type ReactElement, type ReactNode } from "react";
import { SQLiteProvider } from "expo-sqlite";

import milestoneDatabaseAsset from "@/statics/pk.sqlite";

export interface MilestoneDatabaseProviderProps {
  readonly children: ReactNode;
}

export default function MilestoneDatabaseProvider({
  children,
}: MilestoneDatabaseProviderProps): ReactElement {
  return (
    <SQLiteProvider
      assetSource={{ assetId: milestoneDatabaseAsset }}
      databaseName="pk-v1.sqlite"
    >
      {children}
    </SQLiteProvider>
  );
}
