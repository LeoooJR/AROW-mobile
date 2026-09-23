/** @jest-environment node */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const EAS_ASSET_INCLUSIONS = [
  "# Generated railway assets required by EAS Build",
  "!/src/statics/lignes-par-type.geojson",
  "!/src/statics/milestones.geojson",
  "!/src/statics/railway_reference.sqlite",
].join("\n");

describe("EAS build asset inclusion", () => {
  test("inherits every Git ignore rule before including generated assets", () => {
    const gitignore = readFileSync(resolve(".gitignore"), "utf8").trimEnd();
    const easignore = readFileSync(resolve(".easignore"), "utf8").trimEnd();

    expect(easignore).toBe(`${gitignore}\n\n${EAS_ASSET_INCLUSIONS}`);
  });
});
