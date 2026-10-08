import { fetch } from "expo/fetch";

import { BASEMAP_SOURCE_URL } from "./basemap-config";
import { createBasemapStartupAttempt } from "./check-basemap-source";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));
const fetchMock = jest.mocked(fetch);
type Response = Awaited<ReturnType<typeof fetch>>;
const response = (
  body: unknown = { tiles: ["https://tiles.test/{z}/{x}/{y}.pbf"] },
  ok = true,
) => ({ ok, json: async () => body }) as Response;

function pendingResponse() {
  let resolve!: (value: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

function setup() {
  const actions = { onReady: jest.fn(), onFailure: jest.fn() };
  const attempt = createBasemapStartupAttempt(actions);
  const controller = new AbortController();
  return { actions, attempt, controller };
}

beforeEach(() => fetchMock.mockReset());

test("creating an attempt performs no request", () => {
  setup();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("rendering before checking still waits for validated availability", async () => {
  const pending = pendingResponse();
  fetchMock.mockReturnValue(pending.promise);
  const { actions, attempt, controller } = setup();
  attempt.onRendered();
  attempt.onRendered();
  const check = attempt.check(controller.signal);
  expect(actions.onReady).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledWith(BASEMAP_SOURCE_URL, {
    signal: controller.signal,
    headers: { "Cache-Control": "no-cache" },
  });
  pending.resolve(response());
  await check;
  attempt.onRendered();
  await attempt.check(controller.signal);
  expect(actions.onReady).toHaveBeenCalledTimes(1);
  expect(actions.onFailure).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("availability before rendering waits for the first complete render", async () => {
  fetchMock.mockResolvedValue(response());
  const { actions, attempt, controller } = setup();
  await attempt.check(controller.signal);
  expect(actions.onReady).not.toHaveBeenCalled();
  attempt.onRendered();
  attempt.onRendered();
  expect(actions.onReady).toHaveBeenCalledTimes(1);
});

test.each([
  ["HTTP error", response(undefined, false)],
  ["missing tiles", response({})],
  ["empty tiles", response({ tiles: [] })],
  ["invalid tiles", response({ tiles: [42] })],
  ["null metadata", response(null)],
])(
  "%s fails once and cannot become ready afterward",
  async (_label, result) => {
    fetchMock.mockResolvedValue(result);
    const { actions, attempt, controller } = setup();
    await attempt.check(controller.signal);
    attempt.onRendered();
    await attempt.check(controller.signal);
    expect(actions.onFailure).toHaveBeenCalledTimes(1);
    expect(actions.onReady).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  },
);

test("network failure reports failure rather than rejecting the check", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  const { actions, attempt, controller } = setup();
  await expect(attempt.check(controller.signal)).resolves.toBeUndefined();
  expect(actions.onFailure).toHaveBeenCalledTimes(1);
});

test("JSON parsing failure reports failure", async () => {
  const result = response();
  jest.spyOn(result, "json").mockRejectedValue(new SyntaxError("invalid JSON"));
  fetchMock.mockResolvedValue(result);
  const { actions, attempt, controller } = setup();
  await attempt.check(controller.signal);
  expect(actions.onFailure).toHaveBeenCalledTimes(1);
  expect(actions.onReady).not.toHaveBeenCalled();
});

test("an already aborted signal starts no request", async () => {
  const { actions, attempt, controller } = setup();
  controller.abort();
  attempt.onRendered();
  await attempt.check(controller.signal);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(actions.onReady).not.toHaveBeenCalled();
  expect(actions.onFailure).not.toHaveBeenCalled();
});

test.each(["success", "failure"])(
  "cancellation ignores late request %s and render events",
  async (outcome) => {
    const pending = pendingResponse();
    fetchMock.mockReturnValue(pending.promise);
    const { actions, attempt, controller } = setup();
    const check = attempt.check(controller.signal);
    controller.abort();
    attempt.onRendered();
    if (outcome === "success") pending.resolve(response());
    else pending.reject(new Error("cancelled"));
    await check;
    expect(actions.onReady).not.toHaveBeenCalled();
    expect(actions.onFailure).not.toHaveBeenCalled();
  },
);

test("cancellation after availability suppresses later rendering", async () => {
  fetchMock.mockResolvedValue(response());
  const { actions, attempt, controller } = setup();
  await attempt.check(controller.signal);
  controller.abort();
  attempt.onRendered();
  expect(actions.onReady).not.toHaveBeenCalled();
});

test.each(["success", "failure"])(
  "a repeated check ignores superseded %s even with the same signal",
  async (outcome) => {
    const old = pendingResponse();
    const current = pendingResponse();
    fetchMock
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(current.promise);
    const { actions, attempt, controller } = setup();
    attempt.onRendered();
    const first = attempt.check(controller.signal);
    const second = attempt.check(controller.signal);
    if (outcome === "success") old.resolve(response());
    else old.reject(new Error("old request failed"));
    await first;
    expect(actions.onReady).not.toHaveBeenCalled();
    expect(actions.onFailure).not.toHaveBeenCalled();
    current.resolve(response());
    await second;
    expect(actions.onReady).toHaveBeenCalledTimes(1);
  },
);

test("a replacement check discards earlier availability", async () => {
  const pending = pendingResponse();
  fetchMock
    .mockResolvedValueOnce(response())
    .mockReturnValueOnce(pending.promise);
  const { actions, attempt, controller } = setup();
  await attempt.check(controller.signal);
  const replacement = attempt.check(controller.signal);
  attempt.onRendered();
  expect(actions.onReady).not.toHaveBeenCalled();
  pending.resolve(response());
  await replacement;
  expect(actions.onReady).toHaveBeenCalledTimes(1);
});

test("a fresh attempt does not inherit rendering or failure from the old one", async () => {
  fetchMock
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce(response());
  const first = setup();
  first.attempt.onRendered();
  await first.attempt.check(first.controller.signal);
  const retry = setup();
  await retry.attempt.check(retry.controller.signal);
  first.attempt.onRendered();
  expect(retry.actions.onReady).not.toHaveBeenCalled();
  retry.attempt.onRendered();
  expect(retry.actions.onReady).toHaveBeenCalledTimes(1);
  expect(retry.actions.onFailure).not.toHaveBeenCalled();
});
