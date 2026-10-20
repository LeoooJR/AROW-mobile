import { isLatitude, isLongitude } from "./value-validation";

export interface GeographicCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface GeographicCoordinatesWithHeading extends GeographicCoordinates {
  readonly heading: number | null;
}

export function createGeographicCoordinates(
  coordinates: GeographicCoordinates,
  context = "Geographic coordinates",
): GeographicCoordinates {
  const { latitude, longitude } = coordinates;
  if (!isLatitude(latitude) || !isLongitude(longitude)) {
    throw new Error(`${context} are invalid`);
  }
  return Object.freeze({ latitude, longitude });
}
