import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { Milestone } from "@shared/railway-domain/milestone";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { milestoneFromFeature, railwayFromFeature } from "./feature-parsing";

const milestone = new Milestone({
  id: new MilestoneId(new RailwaySectionId("001000", 1), 241000),
  label: "241+000",
  coordinates: { longitude: 4.86, latitude: 45.74 },
});
const point = milestone.toGeoJSON();
const railway: GeoJSON.Feature = {
  type: "Feature",
  id: "340311:1",
  geometry: {
    type: "LineString",
    coordinates: [
      [1.12, 49.43],
      [1.1, 49.44],
    ],
  },
  properties: {
    code_ligne: "340311",
    rg_troncon: 1,
    idgaia: "gaia",
    lib_ligne: "Raccordement",
    type_ligne: "Raccordement",
  },
};

test("parses milestone identity, metadata and altitude without changing coordinates", () => {
  expect(milestoneFromFeature(point)?.id.value).toBe(milestone.id.value);
  expect(
    milestoneFromFeature({
      ...point,
      geometry: { type: "Point", coordinates: [4.86, 45.74, 172] },
    })?.coordinates,
  ).toEqual(milestone.coordinates);
});

test.each([
  { ...point, id: "wrong-id" },
  { ...point, properties: { ...point.properties, label: "240+000" } },
  { ...point, properties: null },
  { ...point, geometry: { type: "Point" as const, coordinates: [181, 45] } },
  {
    ...point,
    geometry: {
      type: "LineString" as const,
      coordinates: [
        [4, 45],
        [5, 46],
      ],
    },
  },
])("ignores malformed milestone %#", (feature) => {
  expect(milestoneFromFeature(feature)).toBeUndefined();
});

test("parses railway metadata independently of removed geometry PK labels", () => {
  const section = railwayFromFeature(railway);
  expect(section?.id.value).toBe("340311:1");
  expect(section?.name).toBe("Raccordement");
  expect(section?.geometry).toEqual({
    status: "present",
    gaiaId: "gaia",
    railwayType: "Raccordement",
  });
});

test.each([
  { ...railway, id: "wrong-id" },
  { ...railway, properties: { ...railway.properties, code_ligne: "34031" } },
  { ...railway, properties: { ...railway.properties, idgaia: "" } },
  { ...railway, geometry: point.geometry },
])("ignores malformed railway %#", (feature) => {
  expect(railwayFromFeature(feature)).toBeUndefined();
});
