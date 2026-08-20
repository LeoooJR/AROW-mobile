export interface RailwayLineKey {
  readonly codeLigne: string;
  readonly rangTroncon: number;
}

export interface RailwayLineMetadata extends RailwayLineKey {
  readonly gaiaId: string;
  readonly name: string;
  readonly pkDebut: string;
  readonly pkFin: string;
  readonly type: string;
}

export function railwayLineId(key: RailwayLineKey): string {
  return `${key.codeLigne}:${key.rangTroncon}`;
}
