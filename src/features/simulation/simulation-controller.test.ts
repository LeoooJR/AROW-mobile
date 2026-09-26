import { waitFor } from "@testing-library/react-native";

import { Milestone } from "@/features/milestones/domain/milestone";
import { SimulationController } from "@/features/simulation/simulation-controller";

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
  const findMilestone = jest.fn().mockResolvedValue(milestone);
  return { controller, executor, findMilestone, onState, unsubscribe };
}

describe("SimulationController", () => {
  test("cancels lookup before native start", async () => {
    const { controller, executor, findMilestone } = setup();
    const lookup = deferred<Milestone>();
    findMilestone.mockReturnValue(lookup.promise);

    controller.start(milestone, findMilestone);
    await waitFor(() => expect(controller.state.status).toBe("resolving"));
    controller.stop();
    lookup.resolve(milestone);

    expect(controller.state.status).toBe("idle");
    await waitFor(() => expect(executor.start).not.toHaveBeenCalled());
  });

  test("waits for a canceled native start to finish cleanup", async () => {
    const { controller, executor, findMilestone } = setup();
    const start = deferred<{
      latitude: number;
      longitude: number;
      status: "running";
    }>();
    const stop = deferred<{ status: "stopped" }>();
    executor.start.mockReturnValue(start.promise);
    executor.stop.mockReturnValue(stop.promise);

    controller.start(milestone, findMilestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    controller.start(milestone, findMilestone);
    expect(findMilestone).toHaveBeenCalledTimes(1);
    start.resolve({
      latitude: 45.74744,
      longitude: 4.85933,
      status: "running",
    });
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));
    expect(controller.state.status).toBe("starting");
    stop.resolve({ status: "stopped" });
    await waitFor(() => expect(controller.state.status).toBe("idle"));
  });

  test("keeps canceled-start cleanup failure actionable", async () => {
    const { controller, executor, findMilestone } = setup();
    const start = deferred<{ status: "running" }>();
    executor.start.mockReturnValue(start.promise);
    executor.stop.mockResolvedValue({
      code: "CLEANUP_FAILED",
      status: "error",
    });

    controller.start(milestone, findMilestone);
    await waitFor(() => expect(controller.state.status).toBe("starting"));
    controller.stop();
    start.resolve({ status: "running" });
    await waitFor(() =>
      expect(controller.state).toMatchObject({
        code: "CLEANUP_FAILED",
        mayBeActive: true,
        status: "error",
      }),
    );
  });

  test("runs one cleanup at a time and allows retry after failure", async () => {
    const { controller, executor, findMilestone } = setup();
    const firstStop = deferred<{
      code: "CLEANUP_FAILED";
      status: "error";
    }>();
    executor.stop
      .mockReturnValueOnce(firstStop.promise)
      .mockResolvedValueOnce({ status: "stopped" });

    controller.start(milestone, findMilestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    controller.stop();
    controller.stop();
    await waitFor(() => expect(executor.stop).toHaveBeenCalledTimes(1));

    firstStop.resolve({ code: "CLEANUP_FAILED", status: "error" });
    await waitFor(() => expect(controller.state.status).toBe("error"));
    controller.stop();
    await waitFor(() => expect(controller.state.status).toBe("idle"));
    expect(executor.stop).toHaveBeenCalledTimes(2);
  });

  test("discards a snapshot read before a newer start", async () => {
    const { controller, executor, findMilestone } = setup();
    const snapshot = deferred<{ status: "stopped" }>();
    executor.getSnapshot.mockReturnValue(snapshot.promise);
    const reconciliation = controller.reconcile();
    await waitFor(() => expect(executor.getSnapshot).toHaveBeenCalledTimes(1));

    controller.start(milestone, findMilestone);
    await waitFor(() => expect(controller.state.status).toBe("running"));
    snapshot.resolve({ status: "stopped" });
    await reconciliation;
    expect(controller.state.status).toBe("running");
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
});
