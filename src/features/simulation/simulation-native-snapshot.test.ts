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
