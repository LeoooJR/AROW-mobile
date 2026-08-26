import { type ReactElement } from "react";

import { type MilestoneDatabaseProviderProps } from "./milestone-database-provider";

export default function MilestoneDatabaseProvider({
  children,
}: MilestoneDatabaseProviderProps): ReactElement {
  return <>{children}</>;
}
