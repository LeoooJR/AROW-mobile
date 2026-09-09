import { Milestone } from "./milestone";
import { milestoneRecordsToFeatures } from "./milestone-record";

const VALID_RECORD = {
  code_ligne: "001000",
  label: "241+000",
  latitude: 45.74491,
  longitude: 4.86234,
  position_m: 241_000,
  rg_troncon: 1,
};

describe("milestone database records", () => {
  test("converts a validated record to a domain milestone", () => {
    const milestones = milestoneRecordsToFeatures([VALID_RECORD]);
    const milestone = milestones[0];

    expect(milestones).toHaveLength(1);
    expect(milestone).toBeInstanceOf(Milestone);
    expect(milestone?.coordinates).toEqual({
      latitude: 45.74491,
      longitude: 4.86234,
    });
    expect(milestone?.id).toBe("001000:1:241000");
    expect(milestone?.label).toBe("241+000");
  });

  test("converts an empty result", () => {
    expect(milestoneRecordsToFeatures([])).toEqual([]);
  });

  test.each([
    ["a missing field", { ...VALID_RECORD, label: undefined }],
    ["a negative position", { ...VALID_RECORD, position_m: -1 }],
    ["a non-integer position", { ...VALID_RECORD, position_m: 1.5 }],
    ["an invalid latitude", { ...VALID_RECORD, latitude: 91 }],
    ["an invalid longitude", { ...VALID_RECORD, longitude: -181 }],
  ])("rejects %s", (_description, record) => {
    expect(() => milestoneRecordsToFeatures([record])).toThrow(
      "Invalid milestone at row 0",
    );
  });
});
