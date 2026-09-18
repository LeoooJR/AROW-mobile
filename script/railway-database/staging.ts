import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

import type { RailwayResources, StagingWorkspace } from "./types";

interface StagingOptions {
  readonly databasePath: string;
  readonly geojsonPath: string;
  readonly resources: RailwayResources;
}

interface Backup {
  readonly backupPath: string;
  readonly targetPath: string;
}

function restoreBackups(
  backups: readonly Backup[],
  promotedPaths: readonly string[],
): void {
  for (const targetPath of [...promotedPaths].reverse()) {
    rmSync(targetPath, { force: true });
  }
  for (const backup of [...backups].reverse()) {
    if (existsSync(backup.backupPath)) {
      renameSync(backup.backupPath, backup.targetPath);
    }
  }
}

export function createStagingWorkspace({
  databasePath,
  geojsonPath,
  resources,
}: StagingOptions): StagingWorkspace {
  const targetDatabasePath = resolve(databasePath);
  const targetGeojsonPath = resolve(geojsonPath);
  if (dirname(targetDatabasePath) !== dirname(targetGeojsonPath)) {
    throw new Error("Generated railway assets must share an output directory");
  }

  const outputDirectory = dirname(targetDatabasePath);
  mkdirSync(outputDirectory, { recursive: true });
  const directory = mkdtempSync(join(outputDirectory, ".railway-database-"));
  return Object.freeze({
    directory,
    rawGeojsonPath: join(directory, resources.geojson.name),
    rawMilestonesPath: join(directory, resources.milestones.name),
    stagedDatabasePath: join(directory, "railway_reference.generated"),
    stagedGeojsonPath: join(directory, "lignes-par-type.generated"),
    targetDatabasePath,
    targetGeojsonPath,
  });
}

export function promoteStagedOutputs(workspace: StagingWorkspace): void {
  const outputs = [
    {
      stagingPath: workspace.stagedGeojsonPath,
      targetPath: workspace.targetGeojsonPath,
    },
    {
      stagingPath: workspace.stagedDatabasePath,
      targetPath: workspace.targetDatabasePath,
    },
  ];
  const backups: Backup[] = [];
  const promotedPaths: string[] = [];
  try {
    for (const [index, output] of outputs.entries()) {
      if (existsSync(output.targetPath)) {
        const backupPath = join(workspace.directory, `backup-${index}`);
        renameSync(output.targetPath, backupPath);
        backups.push({ backupPath, targetPath: output.targetPath });
      }
    }
    for (const output of outputs) {
      renameSync(output.stagingPath, output.targetPath);
      promotedPaths.push(output.targetPath);
    }
  } catch (cause) {
    restoreBackups(backups, promotedPaths);
    throw cause;
  }
}

export function removeStagingWorkspace(workspace: StagingWorkspace): void {
  rmSync(workspace.directory, { force: true, recursive: true });
}
