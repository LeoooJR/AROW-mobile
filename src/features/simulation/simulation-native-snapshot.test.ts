import { positionFromSnapshot } from "./simulation-native-snapshot";

test("converts an applied fix without inventing accuracy or heading", () => {
  expect(
    positionFromSnapshot({ status: "running", latitude: 0, longitude: -2 }),
  ).toEqual({
    latitude: 0,
    longitude: -2,
    accuracy: null,
    heading: null,
  });
});

test.each([
  { status: "running" as const, latitude: 1 },
  { status: "running" as const, longitude: 2 },
  { status: "stopped" as const },
])("ignores incomplete coordinates %j", (snapshot) => {
  expect(positionFromSnapshot(snapshot)).toBeUndefined();
});
