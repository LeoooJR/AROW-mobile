import { createHash } from "node:crypto";
import { createWriteStream, rmSync } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

import type {
  FetchImplementation,
  RailwayResource,
  RailwayResources,
} from "./types";

function googleDriveDownloadUrl(fileId: string): string {
  const url = new URL("https://drive.usercontent.google.com/download");
  url.searchParams.set("id", fileId);
  url.searchParams.set("export", "download");
  url.searchParams.set("confirm", "t");
  return url.href;
}

function resourceDownloadUrl(resource: RailwayResource): string {
  if (resource.url !== undefined) {
    return resource.url;
  }
  return googleDriveDownloadUrl(resource.fileId);
}

export const RAILWAY_RESOURCES: RailwayResources = Object.freeze({
  geojson: Object.freeze({
    fileId: "14gdtFn97t19Yf-BnU0q8Z9p9Ap5lXhM_",
    name: "lignes-par-type.geojson",
    sha256: "931b0f0917b8be71c0f97d6bb90d4c34c9d9ff9d4a389b01a4de9a58c9c62066",
  }),
  milestoneGeojson: Object.freeze({
    fileId: "1JP5YqqHin5xU8zB4fO7A2b8vcpKx6rpt",
    name: "milestones.geojson",
    sha256: "b4cf15764472faae850bcbd003a10d0e18c86bf7123491a9b45990907a05229f",
  }),
  milestones: Object.freeze({
    fileId: "1U4w1nFcEn2EWpL5Z2Eg0IqPoozoGA_jy",
    name: "referentiel_pk_gps.csv",
    sha256: "0b106045e866aee214ea86700b50d6f6ab4c783a267a76c41d6674cde2de6d95",
  }),
});

export async function downloadResource(
  resource: RailwayResource,
  destinationPath: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<void> {
  const url = resourceDownloadUrl(resource);
  let response: Response;
  try {
    response = await fetchImplementation(url, { redirect: "follow" });
  } catch (cause) {
    throw new Error(`Could not download ${resource.name}`, { cause });
  }

  if (!response.ok) {
    throw new Error(
      `Could not download ${resource.name}: HTTP ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type")?.toLowerCase();
  if (contentType?.includes("text/html")) {
    throw new Error(
      `Could not download ${resource.name}: Google Drive returned HTML instead of the resource`,
    );
  }
  if (response.body === null) {
    throw new Error(`Could not download ${resource.name}: empty response body`);
  }

  const hash = createHash("sha256");
  const hashingStream = new Transform({
    transform(chunk: Uint8Array, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.from(response.body),
      hashingStream,
      createWriteStream(destinationPath, { flags: "wx" }),
    );
    const actualChecksum = hash.digest("hex");
    if (actualChecksum !== resource.sha256) {
      throw new Error(
        `${resource.name} checksum mismatch: expected ${resource.sha256}, received ${actualChecksum}`,
      );
    }
  } catch (cause) {
    rmSync(destinationPath, { force: true });
    throw cause;
  }
}
