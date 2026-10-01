export function normalizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
