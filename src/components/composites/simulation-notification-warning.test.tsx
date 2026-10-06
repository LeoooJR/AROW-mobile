import { act, render, screen } from "@testing-library/react-native";
import { AppState, type AppStateStatus } from "react-native";

import { useToast } from "@/components/adapters/toast";
import {
  SimulationContext,
  type SimulationModel,
} from "@/features/simulation/simulation-context";
import SimulationNotificationWarning from "./simulation-notification-warning";

jest.mock("@gluestack-ui/core/toast/creator", () => ({
  createToastHook: () => jest.fn(),
}));

jest.mock("@/components/adapters/toast", () => ({
  ...jest.requireActual("@/components/adapters/toast"),
  useToast: jest.fn(),
}));

const show = jest.fn();
const close = jest.fn();
let foreground!: (state: AppStateStatus) => void;
const remove = jest.fn();
const model: SimulationModel = {
  notificationWarningId: 0,
  state: {
    status: "running",
    position: { latitude: 1, longitude: 2, accuracy: 0, heading: 0 },
  },
  start: jest.fn(),
  stop: jest.fn(),
  dismissStartError: jest.fn(),
};

function application(
  id: number,
  running = true,
  state?: SimulationModel["state"],
) {
  return (
    <SimulationContext.Provider
      value={{
        ...model,
        notificationWarningId: id,
        state: state ?? (running ? model.state : { status: "idle" }),
      }}
    >
      <SimulationNotificationWarning />
    </SimulationContext.Provider>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  AppState.currentState = "active";
  jest
    .mocked(useToast)
    .mockReturnValue({ show, close, closeAll: jest.fn(), isActive: jest.fn() });
  jest.spyOn(AppState, "addEventListener").mockImplementation((_, listener) => {
    foreground = listener;
    return { remove };
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("shows one polite warning, expires at eight seconds, and never repeats reconciliation", async () => {
  const view = await render(application(0));
  expect(show).not.toHaveBeenCalled();
  await view.rerender(application(1));
  expect(show).toHaveBeenCalledTimes(1);
  const config = show.mock.calls[0][0];
  expect(config).toMatchObject({
    id: "simulation-notifications-disabled",
    placement: "top",
    duration: null,
  });
  await render(config.render());
  expect(screen.getByTestId("simulation-notification-warning")).toHaveProp(
    "accessibilityLiveRegion",
    "polite",
  );
  expect(screen.getByText("Notifications désactivées")).toBeOnTheScreen();
  close.mockClear();
  await act(async () => jest.advanceTimersByTime(7_999));
  expect(close).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(close).toHaveBeenCalledWith(config.id);
  await view.rerender(application(1));
  expect(show).toHaveBeenCalledTimes(1);
});

test("changing toast callbacks preserves the deadline and uses the latest close callback", async () => {
  const view = await render(application(1));
  close.mockClear();
  await act(async () => jest.advanceTimersByTime(4_000));
  const nextClose = jest.fn();
  const nextShow = jest.fn();
  jest.mocked(useToast).mockReturnValue({
    show: nextShow,
    close: nextClose,
    closeAll: jest.fn(),
    isActive: jest.fn(),
  });
  await view.rerender(application(1));
  expect(close).not.toHaveBeenCalled();
  expect(nextClose).not.toHaveBeenCalled();
  expect(nextShow).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(3_999));
  expect(nextClose).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(1));
  expect(nextClose).toHaveBeenCalledWith("simulation-notifications-disabled");
  expect(close).not.toHaveBeenCalled();
  nextClose.mockClear();
  await view.rerender(application(2));
  expect(nextShow).toHaveBeenCalledTimes(1);
  await view.unmount();
  expect(nextClose).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(8_000));
  expect(nextClose).toHaveBeenCalledTimes(1);
});

test("new starts reuse one identifier and reset the deadline; Stop and unmount close it", async () => {
  const view = await render(application(1));
  await act(async () => jest.advanceTimersByTime(4_000));
  await view.rerender(application(1, false));
  expect(close).toHaveBeenCalled();
  await view.rerender(application(2));
  expect(show.mock.calls.map(([config]) => config.id)).toEqual([
    "simulation-notifications-disabled",
    "simulation-notifications-disabled",
  ]);
  close.mockClear();
  await act(async () => jest.advanceTimersByTime(4_000));
  expect(close).not.toHaveBeenCalled();
  await view.unmount();
  expect(close).toHaveBeenCalledTimes(1);
  expect(remove).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(8_000));
  expect(close).toHaveBeenCalledTimes(1);
});

test("uncertain reconciliation preserves the warning and its original deadline", async () => {
  const view = await render(application(1));
  close.mockClear();
  await act(async () => jest.advanceTimersByTime(4_000));
  await view.rerender(
    application(1, true, {
      status: "error",
      code: "SIMULATION_UNAVAILABLE",
      mayBeActive: true,
      origin: "reconciliation",
    }),
  );
  expect(close).not.toHaveBeenCalled();
  await act(async () => jest.advanceTimersByTime(4_000));
  expect(close).toHaveBeenCalledTimes(1);
  await view.rerender(application(1));
  expect(show).toHaveBeenCalledTimes(1);
});

test.each([true, false])(
  "delivers a background event on return only while still running (%s)",
  async (running) => {
    AppState.currentState = "background";
    const view = await render(application(1));
    expect(show).not.toHaveBeenCalled();
    if (!running) await view.rerender(application(1, false));
    await act(async () => foreground("active"));
    expect(show).toHaveBeenCalledTimes(running ? 1 : 0);
  },
);
