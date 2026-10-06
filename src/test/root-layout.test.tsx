import { render, screen } from "@testing-library/react-native";
import { type ReactNode } from "react";
import { Text as MockText, View as MockView } from "react-native";

import RootLayout from "../app/_layout";

jest.mock("expo-router", () => {
  const Stack = ({ children }: { children: ReactNode }) => (
    <MockView testID="routes">{children}</MockView>
  );
  Stack.Screen = function Screen() {
    return null;
  };
  return { Stack };
});
jest.mock("@/features/simulation/simulation-provider", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <MockView testID="simulation-provider">{children}</MockView>
  ),
}));
jest.mock("@/features/railway-reference/provider", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <MockView testID="railway-provider">{children}</MockView>
  ),
}));
jest.mock("@/components/adapters/gluestack-ui-provider", () => ({
  GluestackUIProvider: ({ children }: { children: ReactNode }) => (
    <MockView testID="toast-provider">{children}</MockView>
  ),
}));
jest.mock("@/components/composites/simulation-notification-warning", () => ({
  __esModule: true,
  default: () => <MockText>Notification warning listener</MockText>,
}));
jest.mock("../global.css", () => ({}));

test("mounts the warning and routes inside the existing provider hierarchy", async () => {
  await render(<RootLayout />);
  const warning = screen.getByText("Notification warning listener");
  expect(screen.getByTestId("toast-provider")).toContainElement(warning);
  expect(screen.getByTestId("toast-provider")).toContainElement(
    screen.getByTestId("routes"),
  );
  expect(screen.getByTestId("railway-provider")).toContainElement(
    screen.getByTestId("toast-provider"),
  );
  expect(screen.getByTestId("simulation-provider")).toContainElement(
    screen.getByTestId("railway-provider"),
  );
});
