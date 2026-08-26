import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import MilestoneDatabaseProvider from "./milestone-database-provider.web";

describe("MilestoneDatabaseProvider web fallback", () => {
  test("renders children without mounting SQLite", async () => {
    await render(
      <MilestoneDatabaseProvider>
        <Text>Web application</Text>
      </MilestoneDatabaseProvider>,
    );

    expect(screen.getByText("Web application")).toBeOnTheScreen();
  });
});
