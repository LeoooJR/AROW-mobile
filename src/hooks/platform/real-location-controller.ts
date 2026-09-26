import type { AppStateStatus } from "react-native";

import type {
  LocationPermission,
  LocationWatcher,
  RealLocationSource,
} from "./real-location-source";
import { getRetainedPosition, type LocationState } from "./real-location-state";

export class RealLocationController {
  private locationState: LocationState = { status: "checking" };
  private listener?: (state: LocationState) => void;
  private operation = 0;
  private permissionRequest?: number;
  private watcher?: LocationWatcher;

  constructor(
    private readonly source: RealLocationSource,
    private readonly enabled: boolean,
  ) {}

  get state(): LocationState {
    return this.locationState;
  }

  subscribe(listener: (state: LocationState) => void): () => void {
    this.listener = listener;
    listener(this.locationState);
    this.retry();
    return () => {
      if (this.listener !== listener) return;
      this.listener = undefined;
      this.permissionRequest = undefined;
      this.cancelWatching();
    };
  }

  retry = (): void => {
    if (
      !this.enabled ||
      this.listener === undefined ||
      this.permissionRequest !== undefined
    )
      return;
    const operation = this.cancelWatching();
    void this.checkPermission(operation, false);
  };

  requestAccess = (): void => {
    if (
      !this.enabled ||
      this.listener === undefined ||
      this.permissionRequest !== undefined
    )
      return;
    const operation = this.cancelWatching();
    this.permissionRequest = operation;
    this.publish({ status: "requesting" });
    void this.checkPermission(operation, true);
  };

  openSettings = (): void => {
    const operation = this.operation;
    void this.source.openSettings().catch(() => this.reportFailure(operation));
  };

  onAppStateChange(next: AppStateStatus): void {
    if (this.permissionRequest !== undefined) return;
    if (next === "active") this.retry();
    else this.cancelWatching();
  }

  private async checkPermission(
    operation: number,
    request: boolean,
  ): Promise<void> {
    try {
      const permission = await (request
        ? this.source.requestPermission()
        : this.source.getPermission());
      if (!this.isCurrentOperation(operation)) return;
      if (!permission.granted) {
        this.publish(this.deniedState(permission, request));
        return;
      }
      await this.startWatching(operation);
    } catch {
      this.reportFailure(operation);
    } finally {
      if (this.permissionRequest === operation)
        this.permissionRequest = undefined;
    }
  }

  private deniedState(
    permission: LocationPermission,
    request: boolean,
  ): LocationState {
    return !request && permission.undetermined
      ? { status: "permissionRequired" }
      : { status: "denied", canAskAgain: permission.canAskAgain };
  }

  private async startWatching(operation: number): Promise<void> {
    const servicesEnabled = await this.source.hasServicesEnabled();
    if (!this.isCurrentOperation(operation)) return;
    if (!servicesEnabled) {
      this.publish({ status: "servicesDisabled" });
      return;
    }
    const position = getRetainedPosition(this.locationState);
    this.publish(
      position === undefined
        ? { status: "locating" }
        : { status: "locating", position },
    );
    const watcher = await this.source.watch(
      (location) => {
        if (this.isCurrentOperation(operation)) {
          this.publish({
            position: location.position,
            status: location.mocked ? "mocked" : "connected",
          });
        }
      },
      () => this.reportFailure(operation),
    );
    this.installWatcher(operation, watcher);
  }

  private installWatcher(operation: number, watcher: LocationWatcher): void {
    if (!this.isCurrentOperation(operation)) {
      watcher.remove();
      return;
    }
    this.removeWatcher();
    this.watcher = watcher;
  }

  private cancelWatching(): number {
    ++this.operation;
    this.removeWatcher();
    return this.operation;
  }

  private removeWatcher(): void {
    this.watcher?.remove();
    this.watcher = undefined;
  }

  private isCurrentOperation(operation: number): boolean {
    return this.listener !== undefined && this.operation === operation;
  }

  private reportFailure(operation: number): void {
    if (this.isCurrentOperation(operation)) this.publish({ status: "error" });
  }

  private publish(state: LocationState): void {
    this.locationState = state;
    this.listener?.(state);
  }
}
