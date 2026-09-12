import formatMapFeatureCoordinates from "./map-feature-coordinate-presentation";

describe("formatMapFeatureCoordinates", () => {
  test.each([
    [{ latitude: 45.74491, longitude: 4.86234 }, "45.74491 N · 4.86234 E"],
    [{ latitude: -12.5, longitude: -3.25 }, "12.50000 S · 3.25000 W"],
    [{ latitude: 0, longitude: 0 }, "0.00000 N · 0.00000 E"],
  ] as const)("formats technical map coordinates", (coordinates, expected) => {
    expect(formatMapFeatureCoordinates(coordinates)).toBe(expected);
  });
});
