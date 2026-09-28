import { waitFor } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { SimulationController } from "@/features/simulation/simulation-controller";
import { NativeContractError } from "../../../modules/arow-mock-location/src/decode-native-result";

const milestone = new Milestone({
  coordinates: { latitude: 45.74744, longitude: 4.85933 },
  label: "509+000",
  lineCode: "893000",
  positionMeters: 509_000,
  sectionRank: 1,
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => {
    resolve = complete;
  });
  return { promise, resolve };
}

function setup() {
  const executor = {
    checkReadiness: jest.fn().mockResolvedValue({ ready: true }),
    getSnapshot: jest.fn().mockResolvedValue({ status: "stopped" }),
    start: jest.fn().mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    }),
    stop: jest.fn().mockResolvedValue({ status: "stopped" }),
  };
  const controller = new SimulationController(async () => executor);
  const onState = jest.fn();
  const unsubscribe = controller.subscribe(onState);
  return { controller, executor, onState, unsubscribe };
}

describe("SimulationController", () => {
  test("uses the selected milestone after readiness and waits for the first fix", async () => {
    const { controller, executor } = setup();
    const readiness = deferred<{ ready: true }>();
    const firstFix = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    executor.checkReadiness.mockReturnValue(readiness.promise);
    executor.start.mockReturnValue(firstFix.promise);

    controller.start(milestone);
    expect(controller.state.status).toBe("checking");
    expect(executor.start).not.toHaveBeenCalled();

    readiness.resolve({ ready: true });
    await waitFor(() =>
      expect(executor.start).toHaveBeenCalledWith(45.74744, 4.85933),
    );
    expect(controller.state.status).toBe("starting");

    firstFix.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await waitFor(() => expect(controller.state.status).toBe("running"));
  });

  test("exposes malformed initial reconciliation as uncertain active state", async () => {
    const { controller, executor } = setup();
    executor.getSnapshot.mockRejectedValue(new NativeContractError("snapshot"));
    await controller.reconcile();
    expect(controller.state).toEqual({
      status: "error",
      code: "SIMULATION_UNAVAILABLE",
      mayBeActive: true,
    });
  });

  test.each([true, false])(
    "uses reported ownership %s rather than the error code",
    async (ownsProviders) => {
      const { controller, executor } = setup();
      executor.start.mockResolvedValue({
        status: "error",
        code: "APPLY_FAILED",
        ownsProviders,
      });
      controller.start(milestone);
      await waitFor(() =>
        expect(controller.state).toMatchObject({
          status: "error",
          code: "APPLY_FAILED",
          mayBeActive: ownsProviders,
        }),
      );
      executor.getSnapshot.mockResolvedValue({
        status: "error",
        code: "CLEANUP_FAILED",
        ownsProviders,
      });
      await controller.reconcile();
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: ownsProviders,
      });
    },
  );

  test("retains the previously applied position when reconciliation reports cleanup failure", async () => {
    const { controller, executor } = setup();
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    executor.getSnapshot.mockResolvedValue({
      status: "error",
      code: "CLEANUP_FAILED",
      ownsProviders: true,
    });
    await controller.reconcile();
    expect(controller.state).toMatchObject({
      status: "error",
      mayBeActive: true,
      position: milestone.coordinates,
    });
  });

  test("does not report a native interrupted start as running", async () => {
    const { controller, executor } = setup();
    executor.start.mockResolvedValue({ status: "stopped" });
    controller.start(milestone);
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        status: "error",
        code: "APPLY_FAILED",
        mayBeActive: false,
      }),
    );
  });

  test("keeps rejected start and stop results conservative", async () => {
    const { controller, executor } = setup();
    executor.start.mockRejectedValue(new NativeContractError("start"));
    controller.start(milestone);
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        status: "error",
        mayBeActive: true,
      }),
    );
    executor.stop.mockRejectedValue(new NativeContractError("stop"));
    controller.stop();
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: true,
      }),
    );
  });

  test("cancels pending readiness before native start", async () => {
    const { controller, executor } = setup();
    const readiness = deferred<{ ready: true }>();
    executor.checkReadiness.mockReturnValue(readiness.promise);

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("checking"));
    controller.stop();
    readiness.resolve({ ready: true });

    expect(controller.state.status).toBe("idle");
    await Promise.resolve();
    expect(executor.start).not.toHaveBeenCalled();
  });

  test("waits for a canceled native start to finish cleanup", async () => {
    const { controller, executor, onState } = setup();
    const start = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    const stop = deferred<{ status: "stopped" }>();
    executor.start.mockReturnValue(start.promise);
    executor.stop.mockReturnValue(stop.promise);

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    expect(controller.state.status).toBe("canceling");
    controller.stop();
    controller.start(milestone);
    expect(executor.start).toHaveBeenCalledTimes(1);
    start.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
    expect(controller.state.status).toBe("stopping");
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(onState).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running" }),
    );
  });

  test("keeps canceled-start cleanup failure actionable", async () => {
    const { controller, executor } = setup();
    const start = deferred<{
      status: "running";
      latitude: number;
      longitude: number;
    }>();
    executor.start.mockReturnValue(start.promise);
    executor.stop.mockResolvedValue({
      code: "CLEANUP_FAILED",
      ownsProviders: true,
      status: "error",
    });

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    start.resolve({ status: "running", latitude: 1, longitude: 2 });
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: true,
        status: "error",
      }),
    );
  });

  test("cleans up a rejected start after cancellation without reporting running", async () => {
    const { controller, executor, onState } = setup();
    let rejectStart!: (reason: Error) => void;
    executor.start.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectStart = reject;
      }),
    );

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    rejectStart(new Error("start failed"));

    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(executor.stop).toHaveBeenCalledTimes(1);
    expect(onState).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: "running" }),
    );
  });

  test("shows stopping without a position when retrying an uncertain cleanup", async () => {
    const { controller, executor } = setup();
    const stop = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockRejectedValue(new NativeContractError("snapshot"));
    executor.stop.mockReturnValue(stop.promise);
    await controller.reconcile();

    controller.stop();
    expect(controller.state).toEqual({
      status: "stopping",
      position: undefined,
    });
    controller.stop();
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
  });

  test("runs one cleanup at a time and allows retry after failure", async () => {
    const { controller, executor } = setup();
    const firstStop = deferred<{
      code: "CLEANUP_FAILED";
      ownsProviders: boolean;
      status: "error";
    }>();
    executor.stop
      .mockReturnValueOnce(firstStop.promise)
      .mockResolvedValueOnce({ status: "stopped" });

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    controller.stop();
    controller.stop();
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));

    firstStop.resolve({
      code: "CLEANUP_FAILED",
      ownsProviders: true,
      status: "error",
    });
    await waitFor(() => expect(controller.state.status).toBe("error"));
    controller.stop();
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(executor.stop).toHaveBeenCalledTimes(2);
  });

  test("discards a snapshot read before a newer start", async () => {
    const { controller, executor } = setup();
    const snapshot = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    const reconciliation = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));

    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    snapshot.resolve({ status: "stopped" });
    await reconciliation;
    expect(controller.state.status).toBe("running");
  });

  test("does not let a late running snapshot overwrite cleanup", async () => {
    const { controller, executor } = setup();
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    const snapshot = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    const stop = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    executor.stop.mockReturnValue(stop.promise);
    const reconciliation = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));

    controller.stop();
    snapshot.resolve({ latitude: 1, longitude: 2, status: "running" });
    await reconciliation;
    expect(controller.state.status).toBe("stopping");
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
  });

  test("does not publish after unsubscribe, then reconciles on a new subscription", async () => {
    const { controller, executor, onState, unsubscribe } = setup();
    const snapshot = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    const pending = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));
    unsubscribe();
    snapshot.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await pending;
    expect(onState).toHaveBeenCalledTimes(1);

    executor.getSnapshot.mockResolvedValue({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    const newListener = jest.fn();
    controller.subscribe(newListener);
    await controller.reconcile();
    expect(newListener).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "running" }),
    );
  });

  test("finishes native cleanup without notifying an unmounted listener", async () => {
    const { controller, executor, onState, unsubscribe } = setup();
    const stop = deferred<{ status: "stopped" }>();
    executor.stop.mockReturnValue(stop.promise);
    controller.start(milestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    controller.stop();
    expect(controller.state.status).toBe("stopping");

    unsubscribe();
    const notifications = onState.mock.calls.length;
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(onState).toHaveBeenCalledTimes(notifications);
  });
});
