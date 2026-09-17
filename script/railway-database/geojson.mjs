import {
  isRecord,
  requireCanonicalLineCode,
  requireCoordinate,
  requireNonEmptyString,
  requirePositiveInteger,
} from "./validation.mjs";

const RAILWAY_PROPERTIES = Object.freeze([
  "type_ligne",
  "idgaia",
  "code_ligne",
  "lib_ligne",
  "rg_troncon",
  "pkd",
  "pkf",
]);
const REMOVED_PROPERTIES = new Set([
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
]);

function requirePosition(value, context) {
  if (!Array.isArray(value) || (value.length !== 2 && value.length !== 3)) {
    throw new Error(`${context} must be a GeoJSON position`);
  }

  requireCoordinate(value[0], -180, 180, `${context} longitude`);
  requireCoordinate(value[1], -90, 90, `${context} latitude`);
  if (
    value.length === 3 &&
    (typeof value[2] !== "number" || !Number.isFinite(value[2]))
  ) {
    throw new Error(`${context} altitude must be finite`);
  }
}

function requireLineCoordinates(value, context) {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error(`${context} must contain at least two positions`);
  }

  value.forEach((position, index) => {
    requirePosition(position, `${context}[${index}]`);
  });
}

function requireGeometry(value, context) {
  if (!isRecord(value)) {
    throw new Error(`${context} must contain a geometry`);
  }

  if (value.type === "LineString") {
    requireLineCoordinates(value.coordinates, `${context} coordinates`);
    return;
  }

  if (value.type === "MultiLineString") {
    if (!Array.isArray(value.coordinates) || value.coordinates.length === 0) {
      throw new Error(`${context} must contain line coordinates`);
    }

    value.coordinates.forEach((line, index) => {
      requireLineCoordinates(line, `${context} coordinates[${index}]`);
    });
    return;
  }

  throw new Error(`${context} must be a LineString or MultiLineString`);
}

function railwaySectionFromFeature(value, index) {
  const context = `Railway feature ${index}`;
  if (
    !isRecord(value) ||
    value.type !== "Feature" ||
    !isRecord(value.properties)
  ) {
    throw new Error(`${context} must be a GeoJSON feature with properties`);
  }

  requireGeometry(value.geometry, context);
  const properties = value.properties;
  const code = requireCanonicalLineCode(
    properties.code_ligne,
    `${context} code_ligne`,
  );
  const rank = requirePositiveInteger(
    properties.rg_troncon,
    `${context} rg_troncon`,
  );
  const id = `${code}:${rank}`;
  if (value.id !== id) {
    throw new Error(`${context} id must be ${id}`);
  }

  const startMilestone = requireNonEmptyString(
    properties.pkd,
    `${context} pkd`,
  );
  const endMilestone = requireNonEmptyString(properties.pkf, `${context} pkf`);
  return Object.freeze({
    code,
    endMilestone,
    gaiaId: requireNonEmptyString(properties.idgaia, `${context} idgaia`),
    hasGeometry: 1,
    name: requireNonEmptyString(properties.lib_ligne, `${context} lib_ligne`),
    railwayType: requireNonEmptyString(
      properties.type_ligne,
      `${context} type_ligne`,
    ),
    rank,
    startMilestone,
  });
}

function normalizedFeature(value, index) {
  const section = railwaySectionFromFeature(
    {
      ...value,
      id: `${value?.properties?.code_ligne}:${value?.properties?.rg_troncon}`,
    },
    index,
  );
  const context = `Railway feature ${index}`;
  for (const property of Object.keys(value.properties)) {
    if (
      !RAILWAY_PROPERTIES.includes(property) &&
      !REMOVED_PROPERTIES.has(property)
    ) {
      throw new Error(`${context} contains unexpected property ${property}`);
    }
  }
  if (
    value.id !== undefined &&
    value.id !== `${section.code}:${section.rank}`
  ) {
    throw new Error(`${context} contains an invalid existing id`);
  }

  return Object.freeze({
    type: "Feature",
    geometry: value.geometry,
    properties: Object.freeze(
      Object.fromEntries(
        RAILWAY_PROPERTIES.map((property) => [
          property,
          value.properties[property],
        ]),
      ),
    ),
    id: `${section.code}:${section.rank}`,
  });
}

function requireFeatureCollection(value) {
  if (!isRecord(value) || value.type !== "FeatureCollection") {
    throw new Error("Railway GeoJSON must be a FeatureCollection");
  }
  if (!Array.isArray(value.features)) {
    throw new Error("Railway GeoJSON features must be an array");
  }
}

function requireUniqueSections(sections) {
  const ids = new Set();
  for (const section of sections) {
    const id = `${section.code}:${section.rank}`;
    if (ids.has(id)) {
      throw new Error(`Duplicate railway section ${id}`);
    }
    ids.add(id);
  }
}

export function normalizeRailwayGeoJson(value) {
  requireFeatureCollection(value);
  const features = value.features.map(normalizedFeature);
  const geojson = Object.freeze({
    type: "FeatureCollection",
    features: Object.freeze(features),
  });
  const sections = features.map(railwaySectionFromFeature);
  requireUniqueSections(sections);
  return Object.freeze({
    geojson,
    sections: Object.freeze(sections),
  });
}

export function parseRailwaySections(value) {
  requireFeatureCollection(value);

  const sections = value.features.map(railwaySectionFromFeature);
  requireUniqueSections(sections);

  return sections;
}
