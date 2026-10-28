export interface MapViewport {
  readonly bounds: readonly [
    west: number,
    south: number,
    east: number,
    north: number,
  ];
  readonly zoom: number;
}
