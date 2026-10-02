import { createHash } from "node:crypto";
import type { Hash } from "node:crypto";
import { createWriteStream, openSync, rmSync } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";

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
  railwayGeojson: Object.freeze({
    maxBytes: 64 * 1024 * 1024,
    timeoutMs: 120_000,
    fileId: "14gdtFn97t19Yf-BnU0q8Z9p9Ap5lXhM_",
    name: "lignes-par-type.geojson",
    sha256: "931b0f0917b8be71c0f97d6bb90d4c34c9d9ff9d4a389b01a4de9a58c9c62066",
  }),
  milestoneGeojson: Object.freeze({
    maxBytes: 32 * 1024 * 1024,
    timeoutMs: 120_000,
    fileId: "1JP5YqqHin5xU8zB4fO7A2b8vcpKx6rpt",
    name: "milestones.geojson",
    sha256: "b4cf15764472faae850bcbd003a10d0e18c86bf7123491a9b45990907a05229f",
  }),
  milestones: Object.freeze({
    maxBytes: 64 * 1024 * 1024,
    timeoutMs: 120_000,
    fileId: "1U4w1nFcEn2EWpL5Z2Eg0IqPoozoGA_jy",
    name: "referentiel_pk_gps.csv",
    sha256: "0b106045e866aee214ea86700b50d6f6ab4c783a267a76c41d6674cde2de6d95",
  }),
});

function validateDownloadLimits(resource: RailwayResource): void {
  if (!Number.isSafeInteger(resource.maxBytes) || resource.maxBytes <= 0) {
    throw new Error(
      `${resource.name}: maxBytes must be a positive safe integer`,
    );
  }
  if (
    !Number.isSafeInteger(resource.timeoutMs) ||
    resource.timeoutMs <= 0 ||
    resource.timeoutMs > 2_147_483_647
  ) {
    throw new Error(
      `${resource.name}: timeoutMs must be an integer between 1 and 2147483647`,
    );
  }
}

async function fetchDownloadResponse(
  resource: RailwayResource,
  url: string,
  fetchImplementation: FetchImplementation,
  signal: AbortSignal,
): Promise<Response> {
  try {
    return await fetchImplementation(url, { redirect: "follow", signal });
  } catch (cause) {
    throw new Error(`Could not download ${resource.name}`, { cause });
  }
}

function validateDownloadResponse(
  resource: RailwayResource,
  response: Response,
): NonNullable<Response["body"]> {
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
  return response.body;
}

function createBoundedHashingStream(
  resource: RailwayResource,
  hash: Hash,
): Transform {
  let downloadedBytes = 0;
  return new Transform({
    transform(chunk: Uint8Array, _encoding, callback) {
      if (chunk.byteLength > resource.maxBytes - downloadedBytes) {
        callback(
          new Error(
            `${resource.name}: download exceeds ${resource.maxBytes} byte limit`,
          ),
        );
        return;
      }
      downloadedBytes += chunk.byteLength;
      hash.update(chunk);
      callback(null, chunk);
    },
  });
}

function validateDownloadChecksum(
  resource: RailwayResource,
  actualChecksum: string,
): void {
  if (actualChecksum !== resource.sha256) {
    throw new Error(
      `${resource.name} checksum mismatch: expected ${resource.sha256}, received ${actualChecksum}`,
    );
  }
}

export async function downloadResource(
  resource: RailwayResource,
  destinationPath: string,
  fetchImplementation: FetchImplementation = fetch,
): Promise<void> {
  validateDownloadLimits(resource);

  const url = resourceDownloadUrl(resource);
  const controller = new AbortController();
  const timeoutError = new Error(
    `${resource.name}: download timed out after ${resource.timeoutMs} ms`,
  );
  const deadline = setTimeout(
    () => controller.abort(timeoutError),
    resource.timeoutMs,
  );
  let response: Response | undefined;
  let ownsDestination = false;
  try {
    response = await fetchDownloadResponse(
      resource,
      url,
      fetchImplementation,
      controller.signal,
    );
    const body = validateDownloadResponse(resource, response);

    const hash = createHash("sha256");
    const hashingStream = createBoundedHashingStream(resource, hash);

    controller.signal.throwIfAborted();
    const fd = openSync(destinationPath, "wx");
    ownsDestination = true;
    await pipeline(
      // DOM and Node declarations differ on BYOB reader types for the same stream.
      Readable.fromWeb(body as NodeReadableStream<Uint8Array>),
      hashingStream,
      createWriteStream(destinationPath, { fd, autoClose: true }),
      { signal: controller.signal },
    );
    validateDownloadChecksum(resource, hash.digest("hex"));
  } catch (cause) {
    const timedOut = controller.signal.reason === timeoutError;
    controller.abort(cause);
    if (
      response?.body !== null &&
      response?.body !== undefined &&
      !response.body.locked
    ) {
      await response.body.cancel().catch(() => undefined);
    }
    if (ownsDestination) {
      rmSync(destinationPath, { force: true });
    }
    if (timedOut) {
      throw timeoutError;
    }
    throw cause;
  } finally {
    clearTimeout(deadline);
  }
}
