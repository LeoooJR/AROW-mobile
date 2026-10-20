# Railway domain vocabulary

The implemented railway vocabulary lives in [`shared/railway-domain/`](../shared/railway-domain/).
Each concept has one authoritative code definition. This glossary explains those
definitions; the constructors and validators enforce their rules.

These are AROW's current application and reference-data conventions, not a complete
model of every railway network. Add new concepts when the application uses them.

## Railway identity and relationships

| Concept         | Meaning and rules                                                                                                                                              | Authoritative module                                                                                  |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Railway         | A named line identified by a canonical code. Owns at least one section, sorted by rank, without duplicate ranks.                                               | [`railway.ts`](../shared/railway-domain/railway.ts)                                                   |
| Line code       | A six-digit string including leading zeroes. Numeric inputs from 0 to 999999 are padded; strings must already be canonical.                                    | [`line-code.ts`](../shared/railway-domain/line-code.ts)                                               |
| Section         | A ranked part of a railway, with a parent reference, geometry metadata, and an optional recorded milestone range.                                              | [`railway-section.ts`](../shared/railway-domain/railway-section.ts)                                   |
| Section ID      | Validated canonical line code plus positive integer section rank. `.value` serializes as `lineCode:sectionRank`, such as `893000:1`; rank alone is not unique. | [`railway-section-id.ts`](../shared/railway-domain/railway-section-id.ts)                             |
| Network feature | The shared identity base for a section or milestone. Stores its concrete ID object once; line code and section rank delegate to that ID.                       | [`abstract-railway-network-feature.ts`](../shared/railway-domain/abstract-railway-network-feature.ts) |

Entity `.id` properties expose structured, readonly ID objects. A section owns a
`RailwaySectionId`; a milestone reuses the supplied `MilestoneId`, whose `sectionId`
identifies its parent section. Compare `.value` for equality across independently
constructed IDs. Object reference equality does not express domain identity.

Serialize `.value` explicitly for GeoJSON IDs, map filters, and string-indexed
collections. Existing serialized formats and database columns remain unchanged.
Exact milestone lookups accept `MilestoneId`; section-bound lookups accept
`RailwaySectionId`. These objects identify a possible record, so a valid ID does
not guarantee that a recorded point exists. Ordinary React keys, collection keys,
form state, and external schema field names retain their existing meanings.

## Milestones and PK

`RailwayInput` and `RailwaySectionInput` describe construction inputs beside their
classes. `MilestoneInput` lives beside `Milestone`. These inputs are not separate
domain models: constructors validate them and expose readonly domain values.

PK (point kilométrique) identifies a position in the railway reference system. It is
not a geographic coordinate or necessarily a distance from a section's geometry start.

| Concept             | Meaning and rules                                                                                                                                                                                 | Authoritative module                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Milestone           | A recorded point combining a supplied milestone ID, matching PK label, and geographic coordinates. Position accessors derive from its ID.                                                         | [`milestone.ts`](../shared/railway-domain/milestone.ts)                     |
| Kilometric position | A non-negative integer metre value. Supported labels contain digits, `+`, then exactly three metric digits: `509+007` means 509007 metres. Leading zeroes in the kilometre part are accepted.     | [`kilometric-position.ts`](../shared/railway-domain/kilometric-position.ts) |
| Milestone ID        | A section ID plus validated non-negative integer metre position, without coordinates or lifecycle state. `.value` serializes as `lineCode:sectionRank:positionMeters`, such as `893000:1:509000`. | [`milestone-id.ts`](../shared/railway-domain/milestone-id.ts)               |

Coordinates use latitude/longitude in degrees, with inclusive ranges [-90, 90] and
[-180, 180]. Generic coordinate interfaces, including a heading variant with
`number | null`, live in [`shared/geographic-coordinates.ts`](../shared/geographic-coordinates.ts).
Its `createGeographicCoordinates` function validates finite values and returns a
frozen coordinate-only copy. Domain constructors supply context for validation
errors; map hit parsing keeps its non-throwing invalid-hit behavior.
Location accuracy and application location state remain application-owned.

`ParsedMilestoneLabel` is the PK parser's result: kilometre and metric strings
preserve their written digits, while `positionMeters` supplies the numeric value.

## Three different section limits

| Concept                  | Meaning and absence                                                                                                                                                                                                                                         | Authoritative module                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Geometry metadata        | Declared start/end PK labels, GAIA ID, and railway type. Contains metadata, not vertices. `status: "absent"` carries no metadata; `status: "present"` requires all four nonempty fields. Its PK labels can differ from recorded limits.                     | `RailwaySectionGeometry` in [`railway-section.ts`](../shared/railway-domain/railway-section.ts) |
| Recorded milestone range | Lowest/highest recorded PK values and matching labels for the exact section, without coordinates. The section's range may be undefined; a single recorded PK has equal minimum and maximum values. Does not imply every intermediate point exists.          | [`railway-milestone-range.ts`](../shared/railway-domain/railway-milestone-range.ts)             |
| Located milestone bounds | First/last recorded `Milestone` objects ordered by numeric PK within the exact section. `first` and `last` are optional: empty sections return neither; one-point sections return the same point as both. Loading and failures belong to application state. | [`railway-milestone-bounds.ts`](../shared/railway-domain/railway-milestone-bounds.ts)           |

For example, geometry metadata can declare `499+752 → 511+605` while recorded
milestones cover `499+000 → 511+000`. These describe different data and must not be
substituted for one another. Endpoint controls use located recorded bounds.

## Ownership and use

`MilestoneNeighbours` in
[`milestone-neighbours.ts`](../shared/railway-domain/milestone-neighbours.ts)
describes the nearest recorded lower and higher numeric PKs in the same section,
plus the recorded `current` milestone, its one-based `positionInSection`, and the
section's recorded `total`. The position is separate from the milestone's PK:
gaps mean its place among recorded points cannot be inferred from its metre value.
Navigation never wraps. A single-point section has position and total equal to
one and no neighbours. An absent current record returns no
descriptor. Loading, retries, camera focus, and selection remain application-owned.

- Import individual modules directly. Domain code uses relative imports and only
  framework-independent shared dependencies.
- Keep classes, constructor inputs, and existing validation together. Do not add
  parallel interfaces describing the same domain objects.
- SQLite schema and row decoders stay in railway-reference. Its mappers convert
  validated records into these domain objects.
- Search/provider states, component props, map unions, simulation state, and
  desktop/mobile messages remain with their respective owners.
- Update the relevant code, tests, and glossary together when domain meaning changes.
