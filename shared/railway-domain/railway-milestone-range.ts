/** Lowest and highest recorded PK values in a section, without coordinates. */
export interface RailwayMilestoneRange {
  readonly maximumLabel: string;
  readonly maximumPositionMeters: number;
  readonly minimumLabel: string;
  readonly minimumPositionMeters: number;
}
