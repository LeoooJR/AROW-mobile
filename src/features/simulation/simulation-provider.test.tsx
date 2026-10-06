import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { type ReactElement } from "react";
import { AppState, Pressable, Text } from "react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { getMockLocationExecutor } from "@/features/simulation/mock-location";
import { prepareSimulationNotifications } from "@/features/simulation/simulation-notifications";

import SimulationProvider from "@/features/simulation/simulation-provider";
import { useSimulation } from "@/hooks/features/use-simulation";

jest.mock("@/features/simulation/simulation-notifications", () => ({
  prepareSimulationNotifications: jest.fn(),
}));

jest.mock("@/features/simulation/mock-location", () => ({
  getMockLocationExecutor: jest.fn(),
}));

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});
const runningSnapshot = {
  latitude: 45.74744,
  longitude: 4.85933,
  status: "running" as const,
};
const executor = {
  checkReadiness: jest.fn(),
  getSnapshot: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};

function Consumer(): ReactElement {
  const { start, state, stop } = useSimulation();
  return (
    <>
      <Text>{state.status}</Text>
      <Pressable
        accessibilityLabel="Start simulation"
        accessibilityRole="button"
        onPress={() => start(milestone)}
      >
        <Text>Start</Text>
      </Pressable>
      <Pressable
        accessibilityLabel="Stop simulation"
        accessibilityRole="button"
        onPress={stop}
      >
        <Text>Stop</Text>
      </Pressable>
    </>
  );
}

function application(showConsumer: boolean): ReactElement {
  return (
    <SimulationProvider>{showConsumer && <Consumer />}</SimulationProvider>
  );
}

describe("SimulationProvider", () => {
  beforeEach(() => {
    process.env.EXPO_OS = "android";
    jest.clearAllMocks();
    jest.spyOn(AppState, "addEventListener").mockReturnValue({
      remove: jest.fn(),
    });
    jest.mocked(getMockLocationExecutor).mockResolvedValue(executor);
    executor.checkReadiness.mockResolvedValue({ ready: true });
    jest.mocked(prepareSimulationNotifications).mockResolvedValue({
      notificationVisible: true,
    });
    executor.getSnapshot.mockResolvedValue({ status: "stopped" });
    executor.start.mockResolvedValue(runningSnapshot);
    executor.stop.mockResolvedValue({ status: "stopped" });
  });

  test("keeps one start operation when the screen remounts during native start", async () => {
    let completeStart!: (result: typeof runningSnapshot) => void;
    executor.start.mockReturnValue(
      new Promise((resolve) => {
        completeStart = resolve;
      }),
    );
    const view = await render(application(true));
    await fireEvent.press(
      screen.getByRole("button", { name: "Start simulation" }),
    );
    expect(await screen.findByText("starting")).toBeOnTheScreen();

    await view.rerender(application(false));
    completeStart(runningSnapshot);
    await waitFor(() => expect(executor.start).toHaveBeenCalledTimes(1));
    await view.rerender(application(true));
    expect(await screen.findByText("running")).toBeOnTheScreen();

    await fireEvent.press(
      screen.getByRole("button", { name: "Start simulation" }),
    );
    expect(executor.checkReadiness).toHaveBeenCalledTimes(1);
    expect(executor.start).toHaveBeenCalledTimes(1);
    await fireEvent.press(
      screen.getByRole("button", { name: "Stop simulation" }),
    );
    expect(await screen.findByText("idle")).toBeOnTheScreen();
    expect(executor.stop).toHaveBeenCalledTimes(1);
  });

  test("finishes cleanup after the screen closes and exposes idle on remount", async () => {
    let completeStop!: (result: { status: "stopped" }) => void;
    executor.stop.mockReturnValue(
      new Promise((resolve) => {
        completeStop = resolve;
      }),
    );
    const view = await render(application(true));
    await fireEvent.press(
      screen.getByRole("button", { name: "Start simulation" }),
    );
    expect(await screen.findByText("running")).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole("button", { name: "Stop simulation" }),
    );
    expect(screen.getByText("stopping")).toBeOnTheScreen();

    await view.rerender(application(false));
    completeStop({ status: "stopped" });
    await view.rerender(application(true));
    expect(await screen.findByText("idle")).toBeOnTheScreen();
    expect(executor.stop).toHaveBeenCalledTimes(1);
  });

  test("owns one foreground listener and keeps reconciling without a screen", async () => {
    const addEventListener = jest.spyOn(AppState, "addEventListener");
    const setInterval = jest.spyOn(global, "setInterval");
    const view = await render(application(true));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    expect(jest.mocked(prepareSimulationNotifications)).not.toHaveBeenCalled();
    await fireEvent.press(
      screen.getByRole("button", { name: "Start simulation" }),
    );
    expect(await screen.findByText("running")).toBeOnTheScreen();
    executor.getSnapshot.mockResolvedValue(runningSnapshot);

    await view.rerender(application(false));
    expect(addEventListener).toHaveBeenCalledTimes(1);
    const onAppStateChange = addEventListener.mock.calls[0][1];
    await act(async () => onAppStateChange("active"));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(2));
    expect(screen.queryByText("idle")).toBeNull();

    const poll = setInterval.mock.calls.find(([, delay]) => delay === 2_000);
    expect(poll).toBeDefined();
    await act(async () => {
      poll?.[0]();
      await Promise.resolve();
    });
    expect(executor.getSnapshot).toHaveBeenCalledTimes(3);
    expect(jest.mocked(prepareSimulationNotifications)).toHaveBeenCalledTimes(
      1,
    );

    await view.rerender(application(true));
    expect(screen.getByText("running")).toBeOnTheScreen();
    expect(addEventListener).toHaveBeenCalledTimes(1);
    const remove = jest.spyOn(addEventListener.mock.results[0].value, "remove");
    await view.unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(executor.stop).not.toHaveBeenCalled();
    addEventListener.mockRestore();
    setInterval.mockRestore();
  });

  test("expires an inactive failed start after five seconds across screen remounts", async () => {
    const view = await render(application(true));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    executor.checkReadiness.mockResolvedValue({
      code: "MOCK_PROVIDER_NOT_SELECTED",
      ready: false,
    });
    jest.useFakeTimers();
    try {
      await fireEvent.press(
        screen.getByRole("button", { name: "Start simulation" }),
      );
      await act(async () => Promise.resolve());
      expect(screen.getByText("error")).toBeOnTheScreen();
      await view.rerender(application(false));
      await act(async () => jest.advanceTimersByTime(4_999));
      await view.rerender(application(true));
      expect(screen.getByText("error")).toBeOnTheScreen();
      await act(async () => jest.advanceTimersByTime(1));
      expect(screen.getByText("idle")).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  test("cancels the old timeout on retry and never expires cleanup errors", async () => {
    const view = await render(application(true));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    executor.checkReadiness.mockResolvedValueOnce({
      code: "MOCK_PROVIDER_NOT_SELECTED",
      ready: false,
    });
    jest.useFakeTimers();
    try {
      await fireEvent.press(
        screen.getByRole("button", { name: "Start simulation" }),
      );
      await act(async () => Promise.resolve());
      expect(screen.getByText("error")).toBeOnTheScreen();
      await act(async () => jest.advanceTimersByTime(1_000));
      await fireEvent.press(
        screen.getByRole("button", { name: "Start simulation" }),
      );
      await act(async () => Promise.resolve());
      expect(screen.getByText("running")).toBeOnTheScreen();
      executor.getSnapshot.mockResolvedValue(runningSnapshot);
      await act(async () => jest.advanceTimersByTime(4_000));
      expect(screen.getByText("running")).toBeOnTheScreen();

      executor.stop.mockResolvedValue({
        code: "CLEANUP_FAILED",
        ownsProviders: false,
        status: "error",
      });
      await fireEvent.press(
        screen.getByRole("button", { name: "Stop simulation" }),
      );
      await act(async () => Promise.resolve());
      expect(screen.getByText("error")).toBeOnTheScreen();
      await act(async () => jest.advanceTimersByTime(5_000));
      expect(screen.getByText("error")).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
      await view.unmount();
    }
  });

  test("does not expire an active-provider start error", async () => {
    const view = await render(application(true));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    executor.start.mockResolvedValue({
      code: "APPLY_FAILED",
      ownsProviders: true,
      status: "error",
    });
    jest.useFakeTimers();
    try {
      await fireEvent.press(
        screen.getByRole("button", { name: "Start simulation" }),
      );
      await act(async () => Promise.resolve());
      expect(screen.getByText("error")).toBeOnTheScreen();
      await act(async () => jest.advanceTimersByTime(5_000));
      expect(screen.getByText("error")).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
      await view.unmount();
    }
  });

  test("clears a pending error timeout when the provider unmounts", async () => {
    const view = await render(application(true));
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    executor.checkReadiness.mockResolvedValue({
      code: "MOCK_PROVIDER_NOT_SELECTED",
      ready: false,
    });
    const clearTimeout = jest.spyOn(global, "clearTimeout");
    try {
      await fireEvent.press(
        screen.getByRole("button", { name: "Start simulation" }),
      );
      expect(await screen.findByText("error")).toBeOnTheScreen();
      await view.unmount();
      expect(clearTimeout).toHaveBeenCalled();
    } finally {
      clearTimeout.mockRestore();
    }
  });
});
