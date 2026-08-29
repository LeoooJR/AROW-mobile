import { createMapStyle } from "./create-map-style";
import { MAP_LAYER_IDS } from "./map-layer-ids";
import { DARK_MAP_STYLE } from "./map-style-dark";
import { LIGHT_MAP_STYLE } from "./map-style-light";

const palette = {
  border: "border",
  borderStrong: "border-strong",
  canvas: "canvas",
  land: "land",
  muted: "muted",
  text: "text",
  textMuted: "text-muted",
} as const;

describe("createMapStyle", () => {
  test("builds the OpenFreeMap source and the railway layer hierarchy", () => {
    const style = createMapStyle("Test map", palette);
    const layerIds = style.layers.map((layer) => layer.id);

    expect(style.version).toBe(8);
    expect(style.name).toBe("Test map");
    expect(style.glyphs).toBe(
      "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    );
    expect(style.sources.openmaptiles).toMatchObject({
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    });
    expect(style.sources.openmaptiles).toHaveProperty(
      "attribution",
      expect.stringContaining("OpenStreetMap"),
    );
    expect(new Set(layerIds).size).toBe(layerIds.length);
    expect(layerIds).toEqual(
      expect.arrayContaining([
        MAP_LAYER_IDS.base.railwayTunnel,
        MAP_LAYER_IDS.base.railwayServiceBed,
        MAP_LAYER_IDS.base.railwayService,
        MAP_LAYER_IDS.base.railwayMainBed,
        MAP_LAYER_IDS.base.railwayMainTies,
        MAP_LAYER_IDS.base.railwayMain,
      ]),
    );
  });

  test("applies semantic palette values to representative layers", () => {
    const style = createMapStyle("Palette map", palette);
    const layers = new Map(style.layers.map((layer) => [layer.id, layer]));

    expect(layers.get(MAP_LAYER_IDS.base.background)).toHaveProperty(
      "paint.background-color",
      palette.canvas,
    );
    expect(layers.get(MAP_LAYER_IDS.base.railwayMain)).toHaveProperty(
      "paint.line-color",
      palette.text,
    );
    expect(layers.get(MAP_LAYER_IDS.base.labelRoad)).toHaveProperty(
      "paint.text-color",
      palette.textMuted,
    );
    expect(layers.get(MAP_LAYER_IDS.base.boundaryCountry)).toHaveProperty(
      "paint.line-color",
      palette.borderStrong,
    );
  });

  test("exports distinct light and dark application styles", () => {
    const lightBackground = LIGHT_MAP_STYLE.layers.find(
      (layer) => layer.id === MAP_LAYER_IDS.base.background,
    );
    const darkBackground = DARK_MAP_STYLE.layers.find(
      (layer) => layer.id === MAP_LAYER_IDS.base.background,
    );

    expect(LIGHT_MAP_STYLE.name).toBe("AROW Light");
    expect(DARK_MAP_STYLE.name).toBe("AROW Dark");
    expect(lightBackground).toHaveProperty("paint.background-color", "#F7F7F6");
    expect(darkBackground).toHaveProperty("paint.background-color", "#151515");
  });
});
