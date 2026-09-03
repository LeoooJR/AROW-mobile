const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const REMOVED_PROPERTIES = [
  "x_d_l93",
  "y_d_l93",
  "x_f_l93",
  "y_f_l93",
  "x_d_wgs84",
  "y_d_wgs84",
  "x_f_wgs84",
  "y_f_wgs84",
  "c_geo_d",
  "c_geo_f",
  "geo_point_2d",
];

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

describe("lignes-par-type GeoJSON", () => {
  test("contains uniquely identified railway lines without derived coordinates", () => {
    const file = readFileSync(
      join(process.cwd(), "src/statics/lignes-par-type.geojson"),
      "utf8",
    );
    const data = JSON.parse(file);

    expect(isRecord(data)).toBe(true);
    if (!isRecord(data) || !Array.isArray(data.features)) {
      throw new Error("Expected a GeoJSON feature collection");
    }

    expect(data.type).toBe("FeatureCollection");
    expect(data.features).toHaveLength(1043);
    const ids = new Set();

    for (const feature of data.features) {
      if (!isRecord(feature) || !isRecord(feature.geometry)) {
        throw new Error("Expected every feature to contain a geometry");
      }
      if (!isRecord(feature.properties)) {
        throw new Error("Expected every feature to contain properties");
      }

      expect(["LineString", "MultiLineString"]).toContain(
        feature.geometry.type,
      );
      expect(typeof feature.properties.code_ligne).toBe("string");
      expect(Number.isInteger(feature.properties.rg_troncon)).toBe(true);
      expect(feature.id).toBe(
        `${feature.properties.code_ligne}:${feature.properties.rg_troncon}`,
      );
      expect(typeof feature.id).toBe("string");
      ids.add(String(feature.id));

      for (const property of REMOVED_PROPERTIES) {
        expect(feature.properties).not.toHaveProperty(property);
      }
    }

    expect(ids.size).toBe(data.features.length);
  });

  test("keeps the compact railway search catalog synchronized", () => {
    const geojson = JSON.parse(
      readFileSync(
        join(process.cwd(), "src/statics/lignes-par-type.geojson"),
        "utf8",
      ),
    );
    const catalog = JSON.parse(
      readFileSync(
        join(process.cwd(), "src/statics/railway-search-catalog.json"),
        "utf8",
      ),
    );
    const expected = geojson.features
      .map(({ properties }) => ({
        lineCode: properties.code_ligne,
        name: properties.lib_ligne,
        sectionRank: properties.rg_troncon,
      }))
      .sort((left, right) =>
        `${left.lineCode}:${left.sectionRank}`.localeCompare(
          `${right.lineCode}:${right.sectionRank}`,
        ),
      );

    expect(catalog).toEqual(expected);
  });
});
