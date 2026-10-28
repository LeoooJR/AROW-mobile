import { MilestoneId } from "@shared/railway-domain/milestone-id";
import { Milestone } from "@shared/railway-domain/milestone";
import { RailwaySectionId } from "@shared/railway-domain/railway-section-id";
import { Railway } from "@shared/railway-domain/railway";
import { pickMapFeature, type MapFeaturePickOptions } from "./feature-picker";
import { MAP_LAYER_IDS } from "./layer-ids";

function point(position: number, longitude = 0) {
  return new Milestone({
    id: new MilestoneId(new RailwaySectionId("001000", 1), position),
    label: `${Math.floor(position / 1000)}+${String(position % 1000).padStart(3, "0")}`,
    coordinates: { longitude, latitude: 45 },
  });
}
const railway: GeoJSON.Feature = {
  type: "Feature",
  id: "001000:1",
  geometry: {
    type: "LineString",
    coordinates: [
      [0, 45],
      [1, 46],
    ],
  },
  properties: {
    code_ligne: "001000",
    rg_troncon: 1,
    idgaia: "gaia",
    lib_ligne: "Line",
    type_ligne: "Ligne",
  },
};
const defaults: MapFeaturePickOptions = {
  point: [100, 100],
  visibility: { milestone: true, railway: true },
  railwayAvailable: true,
};

const selectedSection = new Railway({
  code: "001000",
  name: "Line",
  sections: [{ sectionRank: 2, geometry: { status: "absent" } }],
}).sections[0];

function setup(zoom = 15, points = [point(1000).toGeoJSON()]) {
  return {
    getZoom: jest.fn().mockResolvedValue(zoom),
    project: jest.fn().mockResolvedValue([100, 100]),
    queryRenderedFeatures: jest
      .fn()
      .mockImplementation(async (_bounds, { layers }: { layers: string[] }) =>
        layers.includes(MAP_LAYER_IDS.railway.passive) ? [railway] : points,
      ),
  };
}

test.each([
  [10, 7],
  [12, 11],
  [14, 8],
  [15, 6],
])(
  "accepts the inclusive radius at zoom %s and falls back just outside",
  async (zoom, radius) => {
    const map = setup(zoom);
    map.project.mockResolvedValue([100 + radius, 100]);
    expect((await pickMapFeature(map, defaults, () => true))?.kind).toBe(
      "milestone",
    );
    map.project.mockResolvedValue([100 + radius + 0.001, 100]);
    expect((await pickMapFeature(map, defaults, () => true))?.kind).toBe(
      "railway-section",
    );
    expect(map.queryRenderedFeatures).toHaveBeenLastCalledWith(
      [
        [78, 78],
        [122, 122],
      ],
      { layers: [MAP_LAYER_IDS.railway.passive] },
    );
  },
);

test("rejects diagonal candidates outside the circular target", async () => {
  const map = setup();
  map.project.mockResolvedValue([105, 105]);
  expect((await pickMapFeature(map, defaults, () => true))?.kind).toBe(
    "railway-section",
  );
});

test("selects the nearest candidate, deduplicates identities, and excludes labels from queries", async () => {
  const first = point(1000, 1),
    second = point(2000, 2);
  const map = setup(15, [
    first.toGeoJSON(),
    second.toGeoJSON(),
    first.toGeoJSON(),
  ]);
  map.project.mockImplementation(async ([longitude]: number[]) =>
    longitude === 1 ? [105, 100] : [102, 100],
  );
  expect((await pickMapFeature(map, defaults, () => true))?.id.value).toBe(
    second.id.value,
  );
  expect(map.project).toHaveBeenCalledTimes(2);
  expect(map.queryRenderedFeatures).toHaveBeenCalledTimes(1);
  expect(map.queryRenderedFeatures).toHaveBeenCalledWith(
    [
      [94, 94],
      [106, 106],
    ],
    { layers: ["railway-milestone-dots-1"] },
  );
});

test("uses serialized identity for an exact distance tie", async () => {
  const map = setup(15, [point(2000).toGeoJSON(), point(1000).toGeoJSON()]);
  expect((await pickMapFeature(map, defaults, () => true))?.id.value).toBe(
    point(1000).id.value,
  );
});

test("only the selected irregular point bypasses the display tier, with its visible circle's radius", async () => {
  const selected = point(1772);
  const map = setup(10, [point(1900).toGeoJSON(), selected.toGeoJSON()]);
  map.project.mockResolvedValue([111, 100]);
  expect(
    (
      await pickMapFeature(
        map,
        { ...defaults, selectedFeature: selected },
        () => true,
      )
    )?.id.value,
  ).toBe(selected.id.value);
  expect(map.queryRenderedFeatures).toHaveBeenCalledWith(
    [
      [89, 89],
      [111, 111],
    ],
    {
      layers: [MAP_LAYER_IDS.milestone.dots, MAP_LAYER_IDS.milestone.selected],
    },
  );
  map.project.mockResolvedValue([111.001, 100]);
  expect(
    (
      await pickMapFeature(
        map,
        { ...defaults, selectedFeature: selected },
        () => true,
      )
    )?.kind,
  ).toBe("railway-section");
  expect(map.queryRenderedFeatures).toHaveBeenLastCalledWith(
    [
      [78, 78],
      [122, 122],
    ],
    { layers: [MAP_LAYER_IDS.railway.passive, MAP_LAYER_IDS.railway.selected] },
  );
  expect((await pickMapFeature(map, defaults, () => true))?.kind).toBe(
    "railway-section",
  );
});

test("does not grant unselected points the selected circle radius", async () => {
  const selected = point(2000);
  const map = setup(15);
  map.project.mockResolvedValue([108, 100]);
  expect(
    (
      await pickMapFeature(
        map,
        { ...defaults, selectedFeature: selected },
        () => true,
      )
    )?.kind,
  ).toBe("railway-section");
});

test("a railway selection does not grant the marker selection exception", async () => {
  const map = setup(10, [point(1772).toGeoJSON()]);

  expect(
    (
      await pickMapFeature(
        map,
        { ...defaults, selectedFeature: selectedSection },
        () => true,
      )
    )?.kind,
  ).toBe("railway-section");
  expect(map.project).not.toHaveBeenCalled();
  expect(map.queryRenderedFeatures).toHaveBeenNthCalledWith(
    1,
    [
      [93, 93],
      [107, 107],
    ],
    { layers: [MAP_LAYER_IDS.milestone.dots] },
  );
});

test("ignores ineligible stale points, malformed features and invalid projections", async () => {
  const map = setup(10, [
    point(1500).toGeoJSON(),
    { ...point(1000).toGeoJSON(), id: "wrong" },
  ]);
  expect((await pickMapFeature(map, defaults, () => true))?.kind).toBe(
    "railway-section",
  );
  expect(map.project).not.toHaveBeenCalled();
  map.queryRenderedFeatures.mockResolvedValue([point(1000).toGeoJSON()]);
  map.project.mockResolvedValue([NaN, 100]);
  expect(await pickMapFeature(map, defaults, () => true)).toBeUndefined();
});

test("preserves the first valid railway in rendered order", async () => {
  const map = setup(9);
  const selected = {
    ...railway,
    id: "001000:2",
    properties: { ...railway.properties, rg_troncon: 2 },
  };
  map.queryRenderedFeatures.mockResolvedValue([
    { ...railway, id: "invalid" },
    selected,
    railway,
  ]);
  expect(
    (
      await pickMapFeature(
        map,
        { ...defaults, selectedFeature: selectedSection },
        () => true,
      )
    )?.id.value,
  ).toBe("001000:2");
  expect(map.queryRenderedFeatures).toHaveBeenCalledWith(
    [
      [78, 78],
      [122, 122],
    ],
    { layers: [MAP_LAYER_IDS.railway.passive, MAP_LAYER_IDS.railway.selected] },
  );
});

test.each([
  { visibility: { milestone: false, railway: false } },
  { visibility: { milestone: false, railway: true }, railwayAvailable: false },
])("does not query unavailable sources %#", async (overrides) => {
  const map = setup();
  expect(
    await pickMapFeature(map, { ...defaults, ...overrides }, () => true),
  ).toBeUndefined();
  expect(map.queryRenderedFeatures).not.toHaveBeenCalled();
});

test.each([6.999, NaN, Infinity])(
  "ignores invalid or unavailable hits at zoom %s",
  async (zoom) => {
    const map = setup(zoom);
    expect(await pickMapFeature(map, defaults, () => true)).toBeUndefined();
    expect(map.queryRenderedFeatures).not.toHaveBeenCalled();
  },
);

test("handles empty results and hidden railways", async () => {
  const map = setup(15, []);
  map.queryRenderedFeatures.mockResolvedValue([]);
  expect(await pickMapFeature(map, defaults, () => true)).toBeUndefined();
  expect(
    await pickMapFeature(
      map,
      { ...defaults, visibility: { milestone: true, railway: false } },
      () => true,
    ),
  ).toBeUndefined();
});

test("stops processing if the request becomes obsolete", async () => {
  const map = setup();
  let current = true;
  map.queryRenderedFeatures.mockImplementation(async () => {
    current = false;
    return [point(1000).toGeoJSON()];
  });
  expect(await pickMapFeature(map, defaults, () => current)).toBeUndefined();
  expect(map.project).not.toHaveBeenCalled();
});

test("ignores a projection result completed after camera movement", async () => {
  const map = setup();
  let current = true;
  map.project.mockImplementation(async () => {
    current = false;
    return [100, 100];
  });
  expect(await pickMapFeature(map, defaults, () => current)).toBeUndefined();
  expect(map.queryRenderedFeatures).toHaveBeenCalledTimes(1);
});

test("does not query after the zoom response becomes stale", async () => {
  const map = setup();
  let current = true;
  map.getZoom.mockImplementation(async () => {
    current = false;
    return 15;
  });
  expect(await pickMapFeature(map, defaults, () => current)).toBeUndefined();
  expect(map.queryRenderedFeatures).not.toHaveBeenCalled();
});

test("selected points respect layer visibility and the minimum zoom", async () => {
  const selected = point(1772);
  const map = setup(15, [selected.toGeoJSON()]);
  expect(
    (
      await pickMapFeature(
        map,
        {
          ...defaults,
          selectedFeature: selected,
          visibility: { milestone: false, railway: true },
        },
        () => true,
      )
    )?.kind,
  ).toBe("railway-section");
  expect(map.project).not.toHaveBeenCalled();
  map.getZoom.mockResolvedValue(9);
  expect(
    (
      await pickMapFeature(
        map,
        { ...defaults, selectedFeature: selected },
        () => true,
      )
    )?.kind,
  ).toBe("railway-section");
  expect(map.project).not.toHaveBeenCalled();
});

test("does not invoke native methods for invalid tap coordinates", async () => {
  const map = setup();
  expect(
    await pickMapFeature(map, { ...defaults, point: [NaN, 100] }, () => true),
  ).toBeUndefined();
  expect(map.getZoom).not.toHaveBeenCalled();
});
