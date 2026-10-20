import { createContext } from "react";

export interface AppStartupActions {
  readonly status: "loading" | "error" | "ready";
  readonly onReady: () => void;
  readonly onFailure: () => void;
}

export const AppStartupContext = createContext<AppStartupActions | null>(null);
