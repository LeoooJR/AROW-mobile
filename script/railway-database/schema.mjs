export const RAILWAY_SCHEMA = `
  CREATE TABLE railway_sections_next (
    code_ligne TEXT NOT NULL
      CHECK (length(code_ligne) = 6 AND code_ligne NOT GLOB '*[^0-9]*'),
    rg_troncon INTEGER NOT NULL CHECK (rg_troncon > 0),
    idgaia TEXT,
    lib_ligne TEXT NOT NULL CHECK (length(lib_ligne) > 0),
    type_ligne TEXT,
    pkd TEXT,
    pkf TEXT,
    has_geometry INTEGER NOT NULL CHECK (has_geometry IN (0, 1)),
    CHECK (
      has_geometry = 0 OR
      (idgaia IS NOT NULL AND type_ligne IS NOT NULL AND pkd IS NOT NULL AND pkf IS NOT NULL)
    ),
    PRIMARY KEY (code_ligne, rg_troncon)
  ) STRICT, WITHOUT ROWID;

  CREATE TABLE kilometric_points_next (
    code_ligne TEXT NOT NULL
      CHECK (length(code_ligne) = 6 AND code_ligne NOT GLOB '*[^0-9]*'),
    rg_troncon INTEGER NOT NULL CHECK (rg_troncon > 0),
    position_m INTEGER NOT NULL CHECK (position_m >= 0),
    label TEXT NOT NULL CHECK (length(label) > 0),
    latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    PRIMARY KEY (code_ligne, rg_troncon, position_m),
    FOREIGN KEY (code_ligne, rg_troncon)
      REFERENCES railway_sections_next(code_ligne, rg_troncon)
  ) STRICT, WITHOUT ROWID;
`;
