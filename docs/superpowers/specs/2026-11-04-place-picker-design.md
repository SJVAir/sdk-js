# Place picker support: `label_plural`, lighter place search, monitors by region

## Intent

The data dashboard's place picker needs three server changes, and the SDK
follows each so its types match what the server sends:

- sjvair.com PR #307 adds `label_plural` to every region type in
  `regions/meta/`.
- sjvair.com PR #308 slims `regions/places/search/` rows and adds a `region`
  filter to `monitors/`.

## Decisions (the user's, 2026-11-04)

1. All three changes ship in **5.0.0-beta.3**.
2. They go in **one PR stacked on #45** (`feature/remove-levels`). #45 stays as
   approved and merges first.
3. `label_plural` is Title Case and on region types only (`location_types` is
   unchanged).

## Goals

### 1. `label_plural` on region types

- `regionTypeMetaSchema` (`lib/regions/schemas/regions_meta.ts`) gains
  `label_plural: z.string()`, required (the server always sends it), with JSDoc
  next to `label`.
- `lib/regions/fixtures/regions_meta.json`: every region type gets its value, as
  #307 sends them:

  | type                   | label_plural             |
  | ---------------------- | ------------------------ |
  | county                 | Counties                 |
  | city                   | Cities                   |
  | zipcode                | ZIP Codes                |
  | tract                  | Census Tracts            |
  | cdp                    | Census Designated Places |
  | congressional_district | Congressional Districts  |
  | state_assembly         | State Assembly Districts |
  | state_senate           | State Senate Districts   |
  | school_district        | School Districts         |
  | air_district           | Air Districts            |
  | urban_area             | Urban Areas              |
  | land_use               | Land Use Areas           |
  | protected              | Protected Areas          |
  | ab617                  | AB 617 Communities       |
  | mtrs                   | MTRS Sections            |
  | custom                 | Custom Regions           |

- Test: the fixture validates, and the schema rejects a type without
  `label_plural`.

### 2. `searchRegionPlaces` rows without geometry (sjvair.com #308)

Rows are now `{ id, name, slug, type, external_id, retired, boundary, county }`:

- `boundary` is `{ id, version, bbox } | null`, the regions list's boundary
  (`boundaryListSchema`); `geometry` is gone.
- `county` is `{ type, external_id, name } | null`: `null` on county rows and
  for regions outside every county. Required (always sent).
- No `also_in`.

In `lib/regions/schemas/region.ts`:

- New `regionPlaceMatchSchema`: `regionListItemSchema` without `also_in`, plus
  `county: regionOverlapSchema.nullable()` (same `{ type, external_id, name }`
  shape), with an explicit interface like the others.
- New type `RegionPlaceMatch` in `lib/regions/types.ts` (zinfer).
- `searchRegionPlaces` returns `Promise<Array<RegionPlaceMatch>>`. This is
  breaking. `lookupRegionPlace` is unchanged.
- The module example and JSDoc say the rows have no geometry (use
  `getRegionDetails`) and describe `county`.
- Tests: a stubbed-fetch fixture with a county row (`county: null`) and a city
  row (with `county`) validates; the schema rejects a row without `county`; the
  live step validates against the server.

### 3. `getMonitorsList` region filter (sjvair.com #308)

- `options` gains `region?: string | string[]` next to `dataset`: region ids
  (sqids), sent as `monitors/?region=<id>`; an array repeats the parameter and
  the server returns the union. Combinable with `dataset`. Rows are unchanged.
- An unknown id is a 404, so the call rejects with the server's error. An empty
  string or empty array sends no `region`.
- With `region`, an empty list is a valid answer and does not reject (like
  `dataset`).
- Tests (stubbed fetch): one id, several ids, with `dataset`, an empty array
  sends none, an empty result with `region` resolves to `[]`.
- `api-urls.md`: `monitors/` line becomes `(`?dataset=`,`?region=`)`.

### 4. Docs

- `CHANGELOG.md` under 5.0.0: Added (`label_plural`, the `region` filter) and
  Breaking (`searchRegionPlaces` return type). The betas line keeps "not in a
  beta yet" until beta.3 is cut.
- data-dashboard TODO.md: status update in my docs worktree.

## Non-goals

- `label_plural` on location types.
- Changes to `lookupRegionPlace` or other region calls.
- Updating callers (the dashboard is the only caller of `searchRegionPlaces`).

## Constraints

- Branch `feature/place-picker` from `origin/feature/remove-levels`, worktree
  `.worktrees/place-picker`. The PR targets `release/5.0.0` after #45 merges
  (until then it is based on `feature/remove-levels`).
- Merges only after #45, #307 and #308 are in `develop`, and only with the
  user's yes. No beta without its own yes.
- No AI attribution. Never run lib/account tests.
- `deno check`, `deno lint`, `deno fmt --check` and the stubbed tests pass. The
  live steps fail against a server without the matching changes; that is
  expected (sdk-js CLAUDE.md, "No fallbacks"), and the PR says so.

## My calls (not the user's)

- With a `region` filter, an empty monitors list is a valid answer (a region can
  have no monitors), so it does not reject.
- `county` reuses `regionOverlapSchema`, which has the same shape; the new row
  schema is built from `regionListItemSchema` so the two stay in step.
- The type name `RegionPlaceMatch`.

## Left to the builder

- JSDoc and CHANGELOG wording; whether new steps join existing tests.
