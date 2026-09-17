import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  renameSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";

export function createStagingWorkspace({
  databasePath,
  geojsonPath,
  resources,
}) {
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

function restoreBackups(backups, promotedPaths) {
  for (const targetPath of promotedPaths.reverse()) {
    rmSync(targetPath, { force: true });
  }
  for (const backup of backups.reverse()) {
    if (existsSync(backup.backupPath)) {
      renameSync(backup.backupPath, backup.targetPath);
    }
  }
}

export function promoteStagedOutputs(workspace) {
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
  const backups = [];
  const promotedPaths = [];
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

export function removeStagingWorkspace(workspace) {
  rmSync(workspace.directory, { force: true, recursive: true });
}
