import { act, renderHook, waitFor } from "@testing-library/react-native";
import { fetch } from "expo/fetch";

import type { AppStartupActions } from "@/features/app-startup/context";
import { useMapStartup } from "./use-map-startup";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));
const fetchMock = jest.mocked(fetch);
type Response = Awaited<ReturnType<typeof fetch>>;
const response = (
  body: unknown = { tiles: ["https://tiles.test/{z}/{x}/{y}.pbf"] },
  ok = true,
) => ({ ok, json: async () => body }) as Response;
const startup = (): AppStartupActions => ({
  status: "loading",
  onFailure: jest.fn(),
  onReady: jest.fn(),
});

beforeEach(() => fetchMock.mockReset());

test("rendering alone cannot dismiss loading before the basemap source is available", async () => {
  let resolve!: (value: Response) => void;
  fetchMock.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const model = startup();
  const view = await renderHook(() => useMapStartup(model));
  await act(async () => {
    view.result.current?.();
    view.result.current?.();
  });
  expect(model.onReady).not.toHaveBeenCalled();
  await act(async () => resolve(response()));
  expect(model.onReady).toHaveBeenCalledTimes(1);
});

test("basemap availability alone still waits for full rendering", async () => {
  fetchMock.mockResolvedValue(response());
  const model = startup();
  const view = await renderHook(() => useMapStartup(model));
  expect(model.onReady).not.toHaveBeenCalled();
  await act(async () => view.result.current?.());
  expect(model.onReady).toHaveBeenCalledTimes(1);
});

test.each([
  ["HTTP error", response(undefined, false)],
  ["missing tiles", response({})],
  ["invalid tiles", response({ tiles: [42] })],
])(
  "reports basemap %s instead of accepting a fully rendered blank map",
  async (_label, result) => {
    fetchMock.mockResolvedValue(result);
    const model = startup();
    const view = await renderHook(() => useMapStartup(model));
    await act(async () => view.result.current?.());
    await waitFor(() => expect(model.onFailure).toHaveBeenCalledTimes(1));
    expect(model.onReady).not.toHaveBeenCalled();
  },
);

test("network failure enters the startup error path", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  const model = startup();
  await renderHook(() => useMapStartup(model));
  await waitFor(() => expect(model.onFailure).toHaveBeenCalledTimes(1));
  expect(model.onReady).not.toHaveBeenCalled();
});

test("unmount aborts the old attempt and ignores its late network failure", async () => {
  let reject!: (error: Error) => void;
  fetchMock.mockReturnValue(
    new Promise((_resolve, fail) => {
      reject = fail;
    }),
  );
  const model = startup();
  const view = await renderHook(() => useMapStartup(model));
  const signal = fetchMock.mock.calls[0][1]?.signal;
  await view.unmount();
  expect(signal?.aborted).toBe(true);
  await act(async () => reject(new Error("cancelled")));
  expect(model.onFailure).not.toHaveBeenCalled();
});

test("startup failure cancels an outstanding basemap request", async () => {
  fetchMock.mockReturnValue(new Promise(() => {}));
  const model = startup();
  const view = await renderHook(
    ({ status }: Pick<AppStartupActions, "status">) =>
      useMapStartup({ ...model, status }),
    {
      initialProps: { status: "loading" as AppStartupActions["status"] },
    },
  );
  const signal = fetchMock.mock.calls[0][1]?.signal;
  await view.rerender({ status: "error" });
  expect(signal?.aborted).toBe(true);
});
