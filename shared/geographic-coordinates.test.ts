import { createGeographicCoordinates } from "./geographic-coordinates";

test.each([
  [-90, -180],
  [90, 180],
  [0, 0],
])("accepts inclusive coordinate bounds %p, %p", (latitude, longitude) => {
  expect(createGeographicCoordinates({ latitude, longitude })).toEqual({
    latitude,
    longitude,
  });
});

test.each([
  [91, 0],
  [-91, 0],
  [0, 181],
  [0, -181],
  [NaN, 0],
  [0, NaN],
  [Infinity, 0],
  [-Infinity, 0],
  [0, Infinity],
  [0, -Infinity],
])("rejects invalid coordinates %p, %p", (latitude, longitude) => {
  expect(() => createGeographicCoordinates({ latitude, longitude })).toThrow(
    "Geographic coordinates are invalid",
  );
});

test("creates a frozen coordinate-only copy without altering the input", () => {
  const input = { latitude: 45, longitude: 4, heading: 30 };
  const coordinates = createGeographicCoordinates(input);
  expect(coordinates).not.toBe(input);
  expect(coordinates).toEqual({ latitude: 45, longitude: 4 });
  expect(Object.isFrozen(coordinates)).toBe(true);
  expect(Object.isFrozen(input)).toBe(false);
  input.latitude = 46;
  expect(coordinates.latitude).toBe(45);
  expect(input).toEqual({ latitude: 46, longitude: 4, heading: 30 });
});

test("includes the supplied error context", () => {
  expect(() =>
    createGeographicCoordinates(
      { latitude: NaN, longitude: 0 },
      "Test coordinates",
    ),
  ).toThrow("Test coordinates are invalid");
});
