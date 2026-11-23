# Location groups and valley-wide pesticide locations

_5.0.0-beta.17. Wraps sjvair.com #351 (merged into `develop` at `1af05307`)._

## Why

The data dashboard's spec 7c lists "Schools" and "Child care" as separate
sections of its Map, grouped by server metadata rather than hardcoded type ids,
and with no area chosen it shows every site in the valley in one call. #351 adds
both on the server; this release exposes them.

## Goals

- `regions/meta/`: type the new top-level `location_groups` and each location
  type's `group`, and expose the groups on the `getRegionsMeta` result.
- `pesticides/locations/`: let `getPesticideLocations` ask for the whole valley
  (no area), still filtered by `type` and `county`.

Non-goals: changing the feature rows (unchanged on the server), wrapping
anything else from #351, touching map-sdk or data-dashboard.

## The server (read in code and in a local response, 2026-11-22)

- `regions/meta/` `location_groups`:
  `{"school": {"key": "school", "label": "Schools", "order": 0}, "child_care": {"key": "child_care", "label": "Child care", "order": 1}}`.
  Keys are permanent (`Location.Group`); order is the enum order from 0. Each
  `location_types` row gains `group` (`public_school` and `private_school` →
  `school`, `child_care` → `child_care`), from `Location.TYPE_GROUPS`.
- `pesticides/locations/` with no `region`, no `lat`/`lng` and no non-blank
  `bbox` returns every current location (2,782 locally, ~1.5 MB). `type` and
  `county` still filter. In that case `radius` alone is a 400 ("radius needs lat
  and lng") and `buffer` alone is a 400 ("buffer needs a region").

## Approaches (valley-wide form)

- **A. No area means everywhere (picked by the user).** A fourth member of
  `PesticideLocationsArea` with no area keys, where `radius` and `buffer` are
  `never`, and `params` becomes optional: `getPesticideLocations()` or
  `getPesticideLocations({ type: "child_care" })`. It mirrors the server, and
  the two new 400s become type errors.
- B. An explicit marker such as `{ area: "valley" }`: deliberate at the call
  site, but invents a parameter the server doesn't have.
- C. A separate `getAllPesticideLocations`: clearest name, but duplicates the
  function and its docs.

## Design

**Regions meta** (`lib/regions/schemas/regions_meta.ts`, `get_regions_meta.ts`,
`types.ts`):

- `locationGroupKeySchema`: an open enum of `"school" | "child_care"` (a known
  key, or any newer one), like `locationTypeSchema`. _My call:_ open-ended like
  its sibling `LocationType`, so callers get the known keys while a new server
  group still parses.
- `locationGroupSchema`: `{ key, label, order }`, the same shape as
  `monitorGroupSchema`. `locationTypeMetaSchema` gains a required
  `group: locationGroupKeySchema`.
- `regionsMetaSchema` gains a required
  `location_groups: z.record(z.string(), locationGroupSchema)`. _My call:_ keyed
  by plain string like `monitor_groups`, which avoids the "known keys required"
  typing that `location_types` has (DEFERRED.md small follow-ups).
- Types `LocationGroupKey` and `LocationGroup`, exported where
  `LocationTypeMeta` is.
- `RegionsMeta` gains a `location_groups` getter and `asIter.locationGroups`,
  sorted by `order` (like `MonitorsMeta.asIter.monitor_groups`; camelCase to
  match the regions wrapper's `locationTypes`).

**Pesticide locations** (`lib/pesticides/get_pesticide_locations.ts`):

- `PesticideLocationsArea` gains a member with `bbox`, `region`, `buffer`,
  `lat`, `lng` and `radius` all `?: never`. The existing members get the other
  members' keys as `?: never` as needed so a union-typed variable still narrows
  and `{ radius }` alone or `{ buffer }` alone fails to compile.
- `getPesticideLocations(params: PesticideLocationsParams = {})`; branch on
  `params.bbox !== undefined` / `params.region !== undefined` /
  `params.lat !== undefined`, else send no area. JSDoc and `@example` describe
  the valley-wide call and its size.

**Tests:** extend the stubbed meta test with a fixture key inserted from the
local response (not overwritten); stubbed tests for the valley-wide URL (no area
params), `type`/`county` with no area, and `@ts-expect-error` cases for
`radius`/`buffer` alone; a union-typed variable case. Live tests validate what
comes back and warn on empty, never require counts.

**Docs:** CHANGELOG under 5.0.0-beta.17 (Added; not breaking), `api-urls.md`
wording for `pesticides/locations/`.

## Not breaking

Additive response fields and a widened parameter. A beta needs a server running
sjvair.com `develop` at or after #351.

## Left to the builder

Fixture details, exact JSDoc wording, test file layout.
