/** @jest-environment node */
import { parseMilestoneCsv } from "./csv";

const header = "TYPE_REPER;PK;LIGNE;CODE_LIGNE;RG_TRONCON;latitude;longitude";
function parse(...rows: string[]) {
  return parseMilestoneCsv(
    Buffer.from([header, ...rows, ""].join("\n"), "latin1"),
  );
}

test("accepts every marker type and deduplicates numeric identities before sorting", () => {
  const result = parse(
    "Y - Bif;001+100;001000-1;1000;;48;2",
    "Hectomètre;1+100;001000-1;1000;1;49;3",
    "Kilomètre;0001+100;001000-1;1000;1;invalid;invalid",
    "BaseJSN;000+052;001000-1;1000;1;47,5;1,25",
    "I - ;001+100;001000-2;1000;2;46;4",
    "Any type;001+100;002000-1;2000;1;45;5",
  );
  expect(result.milestones).toEqual([
    {
      code: "001000",
      rank: 1,
      label: "000+052",
      positionMeters: 52,
      latitude: 47.5,
      longitude: 1.25,
    },
    {
      code: "001000",
      rank: 1,
      label: "001+100",
      positionMeters: 1100,
      latitude: 48,
      longitude: 2,
    },
    {
      code: "001000",
      rank: 2,
      label: "001+100",
      positionMeters: 1100,
      latitude: 46,
      longitude: 4,
    },
    {
      code: "002000",
      rank: 1,
      label: "001+100",
      positionMeters: 1100,
      latitude: 45,
      longitude: 5,
    },
  ]);
  expect(
    result.duplicates.map(({ id, kept, discarded }) => ({
      id,
      first: kept.lineNumber,
      next: discarded.lineNumber,
    })),
  ).toEqual([
    { id: "001000:1:1100", first: 2, next: 3 },
    { id: "001000:1:1100", first: 2, next: 4 },
  ]);
  expect(result.duplicates[1].discarded.latitude).toBe("invalid");
});

test.each(["D+000", "000-100", "074+1093", "unknown", "99999999999999999+000"])(
  "skips unsupported PK %s with an explicit reason",
  (label) => {
    const result = parse(`Any;${label};001000-1;1000;1;48;2`);
    expect(result.milestones).toEqual([]);
    expect(result.skipped).toEqual([
      { label, lineNumber: 2, reason: "unsupported-pk" },
    ]);
  },
);

test.each([
  ["Any;001+100;002000-1;1000;1;48;2", "same line"],
  ["Any;001+100;001000-2;1000;1;48;2", "same rank"],
  ["Any;001+100;001000-1;1000;1;91;2", "geographic range"],
  ["Any;001+100;001000-1;1000;1;invalid;2", "decimal number"],
  ["Any;001+100;001000-1;1000;1;48", "7 columns"],
])("still rejects malformed retained rows", (row, message) => {
  expect(() => parse(row)).toThrow(message);
});

test("validates a duplicate's identity before discarding it", () => {
  expect(() =>
    parse(
      "Any;001+000;001000-1;1000;1;48;2",
      "Any;001+000;001000-2;1000;1;49;3",
    ),
  ).toThrow("same rank");
});

test("rejects malformed headers", () => {
  expect(() => parseMilestoneCsv(Buffer.from("PK;TYPE_REPER\n"))).toThrow(
    "header",
  );
});
