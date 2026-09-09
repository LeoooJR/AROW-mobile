import { Milestone } from "./milestone";
import { MilestoneRecord } from "./milestone-query-record";

const VALID_RECORD = {
  code_ligne: "001000",
  label: "241+000",
  latitude: 45.74491,
  longitude: 4.86234,
  position_m: 241_000,
  rg_troncon: 1,
};

describe("MilestoneRecord", () => {
  test("exposes validated database values and converts to a milestone", () => {
    const record = MilestoneRecord.fromUnknown(VALID_RECORD, "at row 0");

    expect(record.lineCode).toBe("001000");
    expect(record.sectionRank).toBe(1);
    expect(record.positionMeters).toBe(241_000);
    expect(record.label).toBe("241+000");
    expect(record.latitude).toBe(45.74491);
    expect(record.longitude).toBe(4.86234);
    expect(Object.isFrozen(record)).toBe(true);

    const milestone = record.toMilestone();
    expect(milestone).toBeInstanceOf(Milestone);
    expect(milestone.coordinates).toEqual({
      latitude: 45.74491,
      longitude: 4.86234,
    });
    expect(milestone.id).toBe("001000:1:241000");
  });

  test.each([
    ["a missing field", { ...VALID_RECORD, label: undefined }],
    ["a negative position", { ...VALID_RECORD, position_m: -1 }],
    ["a non-integer position", { ...VALID_RECORD, position_m: 1.5 }],
    ["an invalid latitude", { ...VALID_RECORD, latitude: 91 }],
    ["an invalid longitude", { ...VALID_RECORD, longitude: -181 }],
  ])("rejects %s with query context", (_description, value) => {
    expect(() => MilestoneRecord.fromUnknown(value, "at row 0")).toThrow(
      "Invalid milestone at row 0",
    );
  });
});
