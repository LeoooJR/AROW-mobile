import { NativeContractError } from "../../../modules/arow-mock-location/src/decode-native-result";
import type {
  NativeSnapshot,
  NativeStartResult,
} from "../../../modules/arow-mock-location/src/native-contracts";

import type { Milestone } from "@/features/milestones/domain/milestone";
import type { MilestoneSearchModel } from "@/features/milestones/search/contracts";
import type { MockLocationExecutor } from "@/features/simulation/mock-location";
import { positionFromSnapshot } from "@/features/simulation/simulation-native-snapshot";
import {
  isSimulationBusy,
  isSimulationRunning,
  isSimulationStopped,
  isSimulationStarting,
  isSimulationError,
  isSimulationStopRequired,
  simulationError,
  type SimulationState,
} from "@/features/simulation/simulation-state";
import type { LocationDescriptor } from "@/types/location-descriptor";

type FindMilestone = MilestoneSearchModel["findMilestone"];
type LoadExecutor = () => Promise<MockLocationExecutor>;

function errorCode(error: unknown): string {
  return error instanceof Error && error.message === "UNSUPPORTED_PLATFORM"
    ? "UNSUPPORTED_PLATFORM"
    : "SIMULATION_UNAVAILABLE";
}

export class SimulationController {
  private simulationState: SimulationState = { status: "idle" };
  private listener?: (state: SimulationState) => void;
  private operation = 0;
  private snapshotRequest = 0;
  private cancelStart = false;
  private stopInFlight = false;

  constructor(private readonly loadExecutor: LoadExecutor) {}

  get state(): SimulationState {
    return this.simulationState;
  }

  subscribe(listener: (state: SimulationState) => void): () => void {
    this.listener = listener;
    listener(this.simulationState);
    return () => {
      if (this.listener === listener) this.listener = undefined;
    };
  }

  start(milestone: Milestone, findMilestone: FindMilestone): void {
    if (
      !isSimulationStopped(this.simulationState) &&
      !(
        isSimulationError(this.simulationState) &&
        !this.simulationState.mayBeActive
      )
    ) {
      return;
    }
    const operation = ++this.operation;
    this.cancelStart = false;
    this.publish({ status: "checking" });
    void this.runStart(operation, milestone, findMilestone);
  }

  stop(): void {
    const previous = this.simulationState;
    if (this.stopInFlight) return;
    if (isSimulationStarting(previous)) {
      this.cancelStart = true;
      return;
    }
    if (previous.status === "checking" || previous.status === "resolving") {
      ++this.operation;
      this.publish({ status: "idle" });
      return;
    }
    if (!isSimulationStopRequired(previous)) {
      return;
    }
    const operation = ++this.operation;
    const position = previous.position;
    this.stopInFlight = true;
    if (position !== undefined) this.publish({ status: "stopping", position });
    void this.runStop(operation, position);
  }

  async reconcile(): Promise<void> {
    if (
      this.listener === undefined ||
      isSimulationBusy(this.simulationState) ||
      this.stopInFlight
    )
      return;
    const operation = this.operation;
    const request = ++this.snapshotRequest;
    try {
      const executor = await this.loadExecutor();
      const snapshot = await executor.getSnapshot();
      if (!this.isFreshSnapshot(operation, request)) return;
      this.applySnapshot(snapshot);
    } catch (error) {
      if (
        this.isFreshSnapshot(operation, request) &&
        (error instanceof NativeContractError ||
          isSimulationRunning(this.simulationState))
      ) {
        this.publish(
          simulationError(
            "SIMULATION_UNAVAILABLE",
            true,
            isSimulationStopRequired(this.simulationState)
              ? this.simulationState.position
              : undefined,
          ),
        );
      }
    }
  }

  private async runStart(
    operation: number,
    milestone: Milestone,
    findMilestone: FindMilestone,
  ): Promise<void> {
    let executor: MockLocationExecutor | undefined;
    try {
      executor = await this.loadExecutor();
      if (!(await this.checkReadiness(operation, executor))) return;
      const resolved = await this.resolveMilestone(
        operation,
        milestone,
        findMilestone,
      );
      if (resolved === undefined) return;
      await this.applyMilestone(operation, executor, resolved);
    } catch (error) {
      if (!this.isCurrent(operation)) return;
      if (this.cancelStart && executor !== undefined) {
        await this.finishCanceledStart(executor);
      } else {
        this.publish(
          simulationError(
            errorCode(error),
            isSimulationStarting(this.simulationState),
          ),
        );
      }
    }
  }

  private async checkReadiness(
    operation: number,
    executor: MockLocationExecutor,
  ): Promise<boolean> {
    const readiness = await executor.checkReadiness();
    if (!this.isCurrent(operation)) return false;
    if (!readiness.ready) {
      this.publish(simulationError(readiness.code));
      return false;
    }
    return true;
  }

  private async resolveMilestone(
    operation: number,
    milestone: Milestone,
    findMilestone: FindMilestone,
  ): Promise<Milestone | undefined> {
    this.publish({ status: "resolving" });
    const resolved = await findMilestone({
      lineCode: milestone.lineCode,
      positionMeters: milestone.positionMeters,
      sectionRank: milestone.sectionRank,
    });
    if (!this.isCurrent(operation)) return undefined;
    if (resolved === undefined || resolved.id !== milestone.id) {
      this.publish(simulationError("MILESTONE_UNAVAILABLE"));
      return undefined;
    }
    return resolved;
  }

  private async applyMilestone(
    operation: number,
    executor: MockLocationExecutor,
    milestone: Milestone,
  ): Promise<void> {
    this.publish({ status: "starting" });
    const result = await executor.start(
      milestone.coordinates.latitude,
      milestone.coordinates.longitude,
    );
    if (this.cancelStart) {
      await this.finishCanceledStart(executor);
    } else if (this.isCurrent(operation)) {
      this.applyStartResult(result);
    }
  }

  private applyStartResult(result: NativeStartResult): void {
    switch (result.status) {
      case "running":
        this.publish({
          position: positionFromSnapshot(result),
          status: "running",
        });
        break;
      case "error":
        this.publish(simulationError(result.code, result.ownsProviders));
        break;
      case "stopped":
        this.publish(simulationError("APPLY_FAILED"));
    }
  }

  private async finishCanceledStart(
    executor: MockLocationExecutor,
  ): Promise<void> {
    try {
      const result = await executor.stop();
      this.publish(
        result.status === "stopped"
          ? { status: "idle" }
          : simulationError(result.code, result.ownsProviders),
      );
    } catch {
      this.publish(simulationError("CLEANUP_FAILED", true));
    } finally {
      this.cancelStart = false;
    }
  }

  private async runStop(
    operation: number,
    position?: LocationDescriptor,
  ): Promise<void> {
    try {
      const executor = await this.loadExecutor();
      const result = await executor.stop();
      if (!this.isCurrent(operation)) return;
      this.publish(
        result.status === "stopped"
          ? { status: "idle" }
          : simulationError(result.code, result.ownsProviders, position),
      );
    } catch {
      if (this.isCurrent(operation)) {
        this.publish(simulationError("CLEANUP_FAILED", true, position));
      }
    } finally {
      this.stopInFlight = false;
    }
  }

  private applySnapshot(snapshot: NativeSnapshot): void {
    if (snapshot.status === "running") {
      this.publish({
        position: positionFromSnapshot(snapshot),
        status: "running",
      });
    } else if (snapshot.status === "error") {
      this.publish(
        simulationError(
          snapshot.code,
          snapshot.ownsProviders,
          isSimulationStopRequired(this.simulationState)
            ? this.simulationState.position
            : undefined,
        ),
      );
    } else if (
      snapshot.status === "stopped" &&
      isSimulationStopRequired(this.simulationState)
    ) {
      this.publish({ status: "idle" });
    }
  }

  private isCurrent(operation: number): boolean {
    return this.operation === operation;
  }

  private isFreshSnapshot(operation: number, request: number): boolean {
    return (
      this.listener !== undefined &&
      this.isCurrent(operation) &&
      this.snapshotRequest === request &&
      !isSimulationBusy(this.simulationState)
    );
  }

  private publish(state: SimulationState): void {
    this.simulationState = state;
    this.listener?.(state);
  }
}
