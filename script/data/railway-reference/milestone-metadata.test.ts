import { milestoneRowsBySection } from "./milestone-metadata";
import { parseMilestoneCsv } from "./csv";

test("classes describe retained numerical PKs after source-order deduplication", () => {
  const csv = [
    "TYPE_REPER;PK;LIGNE;CODE_LIGNE;RG_TRONCON;latitude;longitude",
    "Autre;000+772;001000-1;1000;1;45;4",
    "Kilomètre;0+772;001000-1;1000;1;46;5",
    "Hectomètre;000+000;001000-1;1000;1;45;4",
    "Autre;000+500;001000-1;1000;1;45;4",
    "Kilomètre;000+100;001000-1;1000;1;45;4",
    "Autre;D+000;001000-1;1000;1;45;4",
  ].join("\n");
  const imported = parseMilestoneCsv(Buffer.from(csv, "latin1"));
  const rows = milestoneRowsBySection(imported.milestones).get("001000:1");
  expect(imported.duplicates).toHaveLength(1);
  expect(imported.skipped).toHaveLength(1);
  expect(
    rows?.map((row) => [
      row.position_m,
      row.visibility_class,
      row.position_in_section,
    ]),
  ).toEqual([
    [0, 0, 1],
    [100, 2, 2],
    [500, 1, 3],
    [772, 3, 4],
  ]);
  expect(rows?.[3]).toMatchObject({
    label: "000+772",
    latitude: 45,
    longitude: 4,
  });
});
