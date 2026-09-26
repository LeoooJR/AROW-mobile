import {
  formatCoordinate,
  formatGeographicCoordinates,
  formatLocationDescriptor,
} from "./location-format";

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
