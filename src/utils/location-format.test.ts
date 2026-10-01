import {
  formatCoordinate,
  formatGeographicCoordinates,
  formatLocationDescriptor,
} from "./location-format";

test.each([
  [{ latitude: 45.74491, longitude: 4.86234 }, "45.74491 N · 4.86234 E"],
  [{ latitude: -12.5, longitude: -3.25 }, "12.50000 S · 3.25000 W"],
  [{ latitude: 0, longitude: 0 }, "0.00000 N · 0.00000 E"],
] as const)("formats technical map coordinates", (coordinates, expected) => {
  expect(formatGeographicCoordinates(coordinates, "W")).toBe(expected);
});

test("formats hemispheres, zero, and five decimal places", () => {
  expect(formatCoordinate(-45.123456, "N", "S")).toBe("45.12346 S");
  expect(formatCoordinate(0, "E", "O")).toBe("0.00000 E");
  expect(formatCoordinate(-0, "E", "O")).toBe("0.00000 E");
});

test("preserves each caller's west label", () => {
  const coordinates = { latitude: 1, longitude: -2 };
  expect(formatGeographicCoordinates(coordinates, "W")).toBe(
    "1.00000 N · 2.00000 W",
  );
  expect(formatGeographicCoordinates(coordinates, "O")).toBe(
    "1.00000 N · 2.00000 O",
  );
});

test.each([
  [null, "précision indisponible"],
  [3.6, "précision 4 m"],
  [-3, "précision 0 m"],
] as const)("formats accuracy %s", (accuracy, label) => {
  expect(
    formatLocationDescriptor({
      latitude: 1,
      longitude: -2,
      heading: null,
      accuracy,
    }),
  ).toBe(`1.00000 N · 2.00000 O · ${label}`);
});
