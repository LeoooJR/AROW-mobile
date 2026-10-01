export interface GeographicCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

export interface GeographicCoordinatesWithHeading extends GeographicCoordinates {
  readonly heading: number | null;
}
