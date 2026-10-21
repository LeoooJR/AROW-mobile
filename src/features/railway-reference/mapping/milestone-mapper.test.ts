import { Milestone } from "@shared/railway-domain/milestone";
import {
  milestoneFromDatabaseRow,
  milestoneRowsToBounds,
} from "./milestone-mapper";

const ROW = {
  code_ligne: "893000",
  label: "99+000",
  latitude: 45.74744,
  longitude: 4.85933,
  position_m: 99_000,
  position_in_section: 1,
  rg_troncon: 2,
};

test("maps a validated row to a complete milestone without changing the row", () => {
  const row = Object.freeze({ ...ROW });
  const milestone = milestoneFromDatabaseRow(row, "lookup result");
  expect(milestone).toBeInstanceOf(Milestone);
  expect(milestone.id.value).toBe("893000:2:99000");
  expect(milestone.label).toBe("99+000");
  expect(milestone.positionMeters).toBe(99_000);
  expect(milestone.coordinates).toEqual({
    latitude: 45.74744,
    longitude: 4.85933,
  });
  expect(row).toEqual(ROW);
});

test.each([
  null,
  { ...ROW, label: null },
  { ...ROW, label: "98+000" },
  { ...ROW, latitude: 100 },
  { ...ROW, code_ligne: "invalid" },
])("rejects malformed rows with the caller's diagnostic context", (row) => {
  expect(() => milestoneFromDatabaseRow(row, "lookup result")).toThrow(
    "Invalid milestone lookup result",
  );
});

test("maps ordered endpoint rows through the same milestone conversion", () => {
  const bounds = milestoneRowsToBounds([
    ROW,
    { ...ROW, label: "100+000", position_m: 100_000, latitude: 46 },
  ]);
  expect(bounds.first).toBeInstanceOf(Milestone);
  expect(bounds.last).toBeInstanceOf(Milestone);
  expect(bounds.first?.label).toBe("99+000");
  expect(bounds.last?.label).toBe("100+000");
  expect(bounds.last?.coordinates.latitude).toBe(46);
});

test("preserves empty and single-point bounds", () => {
  expect(milestoneRowsToBounds([])).toEqual({
    first: undefined,
    last: undefined,
  });
  const single = milestoneRowsToBounds([ROW]);
  expect(single.first).toBeInstanceOf(Milestone);
  expect(single.first).toBe(single.last);
});

test("reports invalid endpoint rows with section boundary context", () => {
  expect(() =>
    milestoneRowsToBounds([ROW, { ...ROW, longitude: 200 }]),
  ).toThrow("Invalid milestone section boundary");
});
