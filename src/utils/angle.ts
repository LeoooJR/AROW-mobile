export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function normalizeLongitude(longitude: number): number {
  return longitude >= -180 && longitude <= 180
    ? longitude
    : normalizeDegrees(longitude + 180) - 180;
}
