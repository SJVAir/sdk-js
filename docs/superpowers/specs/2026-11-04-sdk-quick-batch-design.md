# SDK quick batch (HMS dates, GeoJSON batching, CalEnviroScreen, region buffer)

Release 1, step 3, second batch, spec 4 (sdk-js, plus a small sjvair.com
change), for the data dashboard. Drafted 2026-11-04.

**Status:** built and merged 2026-11-04: sjvair.com #303 into `develop`, sdk-js
#40 (and #41) into `release/5.0.0`. After this spec was written, the user
renamed the upcoming release from 4.8.0 to 5.0.0 because of the breaking call
changes below; "4.8.0" here means that release.

Earlier work: spec 1 (sjvair.com #300, sdk-js #37,
`2026-11-03-metadata-scales-design.md`), spec 2 (#301, sdk-js #38), spec 3
(#302, sdk-js #39, `2026-11-04-location-search-design.md`), published through
@sjvair/sdk 4.8.0-beta.6. The requirements are data-dashboard `TODO.md` →
"Release 1, step 3: Metadata enablers" → the spec 1 wrappers item's "Left: …"
part, plus the coordinator's answers (data-dashboard-2c, 2026-11-04) recorded
below.

## Why

The dashboard (step 4, widgets) and map-sdk need a few SDK gaps closed before
they can drop their own workarounds:

- **HMS smoke and fire by date.** `getHMSSmoke`/`getHMSFire` take no date, so
  they only ever return today. map-sdk's demo calls `paginatedApiCall` directly
  with `date`. The dashboard's data layer needs whole-month ranges: HMS is daily
  data fetched as-is and aggregated for display (e.g. smoke days per month
  overlaid on PM2.5), fetched in calendar-month chunks (data-dashboard
  `ARCHITECTURE.md` → "Data resolution & live refresh" → "Datasets without
  summaries").
- **Region GeoJSON for long code lists.** The server looks up at most 100 codes
  per request. map-sdk's demo (`demo/date-range-source.svelte.ts`,
  `boundaries()`) chunks by hand.
- **CalEnviroScreen.** No wrapper exists. Its first consumer is Release 3's
  starter analysis #7 ("tract PM2.5 vs CalEnviroScreen indicators"): indicators
  for the tracts in a region first, one tract's detail second. A CES map layer
  is deferred (data-dashboard `DEFERRED.md` → "Map plugins for the remaining
  server datasets"), so the full statewide list is not needed now.
- **Region buffer.** `regions/<id>/?buffer=` exists on the server but not in the
  SDK, and no metadata lists the allowed distances, so a client offering them
  would hardcode them.
- **`api-urls.md`** has unchecked lines that don't say why.

## Goals

- HMS wrappers that take one day or a date range, plus the server's region and
  density filters, and return every page.
- A server fix so HMS date ranges work (see "Server bug" below).
- `getRegionsGeoJSON`, `getRegionsByCode` and `getLocationsByCode` accept any
  number of codes.
- A small `calenviroscreen/` wrapper: tracts in a region, and one tract, for CES
  4.0 and 5.0, with an "inside only" region option.
- `getRegionDetails` takes `buffer`; the allowed buffers and their labels come
  from `regions/meta/`.
- `api-urls.md` is accurate.

## Non-goals

- `calenviroscreen/meta/` (indicator labels, units, versions). It's planned
  (data-dashboard `ARCHITECTURE.md` → "Metadata as source of truth"), and the
  catalog's empty `meta_url` for `calenviroscreen` is deliberate until then.
  Recorded in DEFERRED.md (see below).
- CES score/percentile threshold filters, the CES full-list map layer, HMS
  `satellite`, `start`/`end` timestamp and fire `method` filters. Nobody needs
  them; easy to add later.
- Wrapping the other unchecked `api-urls.md` endpoints (emissions, TEMPO, tasks,
  time, pesticide extras, forecast detail).
- The sjvair.com hardcoded-value cleanup, pesticide metadata and widget
  endpoints, the documents export, and anything touching production.

## Anti-goals

- Hardcoding server data in the SDK: no density list beyond the existing schema,
  no buffer list, no CES version default.
- Fallbacks for older server responses (sdk-js `CLAUDE.md` → "No fallbacks for
  older server responses"). `regions/meta/`'s new `buffers` field is required in
  the schema.
- Turning one map request into many sequential requests.

## Part 1: sjvair.com (one PR into `develop`)

Branch from `origin/develop` in a worktree (`sjvair.com/.worktrees/<name>`).
Never stop, restart or swap the shared `sjvaircom_web_1` container or workers.
The local server serves the main checkout (`develop`), so this change reaches it
only after the user merges it; until then, verify with the Django tests in the
worktree (run through the existing container's image or `podman exec` against
the worktree's code only if that doesn't touch the running server; otherwise
ask). The sdk-js PR's live tests need this PR merged into `develop` first; say
so in both PRs.

### 1a. Server bug: HMS ranges are ignored without `date`

`SmokeList.get_queryset` and `FireList.get_queryset`
(`camp/api/v2/hms/endpoints.py`) apply the "today, or yesterday before noon"
default whenever the literal `date` key is absent. A request with only
`date__gte`/`date__lte` therefore gets today's rows (and then the range on top),
so a month's range comes back empty or nearly so.

Fix: skip the default when any date filter is present: `date`, `date__gt`,
`date__gte`, `date__lt`, `date__lte` (a non-empty value). Same for both lists.
Tests: a range on smoke and on fire returns rows from several days, including
both end days; no date params still gives today's default; an open-ended range
(`date__gte` only) works.

### 1b. `within_mode` on the CES region filter

`CES4Filter`/`CES5Filter`'s `region_id` (`camp/api/v2/ces/filters.py`) uses
plain `geometry__intersects`, so a county's list includes tracts that only touch
its border (the neighboring counties' edge tracts).

Add `within_mode=contained|overlaps`, matching the regions list's names and
thresholds (`camp/apps/regions/querysets.py`: `contained_within` = at least 99%
of the tract's area inside; `overlaps` = at least 1%; the docstring explains why
99% and not strict containment):

- **Absent:** today's intersects behavior, unchanged. The CES endpoint is
  already on `main` and in production, so its default doesn't change under
  existing users (the user, 2026-11-04).
- **An unknown value:** 400, like the regions list
  (`within_mode must be contained or
  overlaps.`).
- **`within_mode` without `region_id`:** ignored (builder's call if a 400 reads
  better; keep it consistent with the regions list).
- Measure against each CES record's own boundary (`boundary__geometry`), not the
  tract region's current boundary: CES 4.0 `year=2010` records sit on 2010 tract
  boundaries. The existing helpers work on `Region` querysets, so the builder
  factors the area-fraction logic so both can use it (or reimplements it with
  the same thresholds and a comment pointing at the original).
- Both CES 4.0 and 5.0. Tests: a tract inside, a neighbor touching the edge, and
  a tract straddling the region, under each mode and with the param absent; an
  unknown mode is 400.
- Document the param on the filter (it shows in the OpenAPI schema).

### 1c. `buffers` in `regions/meta/`

Add a top-level `buffers` list to `RegionsMeta`, built from `shapes.BUFFERS` and
`shapes.BUFFER_LABELS`:

```json
"buffers": [
  { "miles": 0, "label": "Exact boundary" },
  { "miles": 1, "label": "+1 mile" },
  { "miles": 3, "label": "+3 miles" },
  { "miles": 5, "label": "+5 miles" }
]
```

It's the list every `?buffer=` parameter accepts (region detail, pesticide
sections, emissions map areas). `0` is included because it's a choice a UI
offers ("Exact boundary") and is what an absent `buffer` means. Test that the
list matches `BUFFERS` and that every entry has a label.

## Part 2: sdk-js (one PR into `release/4.8.0`)

Branch from `origin/release/4.8.0` in a worktree (`sdk-js/.worktrees/<name>`).
Follow sdk-js `CLAUDE.md` (Zod-derived types, module JSDoc with
`@example Usage`, `api-urls.md`). Prefer stubbed-fetch tests asserting exact
URLs and params (like `lib/regions/search_locations_test.ts`), plus fixtures
captured from the local API where it has data. Never publish or tag without the
user's yes for that specific release.

### 2a. HMS smoke and fire

```ts
getHMSSmoke(query?: HMSSmokeQuery, options?: RequestOptions): Promise<HMSSmokeGeoJSON[]>
getHMSFire(query?: HMSFireQuery, options?: RequestOptions): Promise<HMSFireGeoJSON[]>
```

- **Query fields:**
  - Either `date` (one day) or `start`/`end` (a range, either side optional).
    The type makes `date` and `start`/`end` mutually exclusive (e.g. a union
    with `never` fields).
  - `region_id` (a region sqid): records that touch the region.
  - `density` (smoke only), typed from `hmsSmokeSchema`'s existing density enum.
    Labels and colors stay in `getHMSMeta`.
- **Dates are `YYYY-MM-DD` strings,** Pacific calendar days as the server stores
  them. No `Date` objects: that would raise which time zone's day it means (the
  dashboard's Pacific-time rule).
- **Mapping:** `date` → `date`; `start` → `date__gte`; `end` → `date__lte` (both
  ends inclusive). Absent fields send nothing; no query keeps the server's today
  default.
- **Every page is fetched,** through `paginatedApiCall` (concurrent pages), so a
  month comes back whole.
- **Breaking change:** today's `getHMSSmoke(options)` becomes
  `getHMSSmoke(undefined, options)`. Accepted by the user (2026-11-04):
  monitor-map (`src/lib/hms/hms.svelte.ts`,
  `getHMSSmoke({ signal })`/`getHMSFire({ signal })`) has to be updated before
  `develop` is released anyway. Note it in the PR and the release notes; the
  forwarding test (`lib/request_options_forwarding_test.ts`) moves to the new
  position.
- Update the module docs' examples to show a day and a range.

### 2b. `getRegionsGeoJSON`, `getRegionsByCode` and `getLocationsByCode` batching

Match map-sdk's demo (coordinator, 2026-11-04):

- De-duplicate the input codes first (keep first-seen order).
- Split into chunks of 100 (a named constant: the server's `LOOKUP_MAX_CODES`;
  it's a request limit, not data, so it isn't in metadata).
- Send the chunks concurrently; pass the caller's request options and signal to
  every chunk.
- **`getRegionsGeoJSON`:** merge into one FeatureCollection, features unchanged,
  in chunk order. map-sdk keys features by `properties.external_id`.
- **`getRegionsByCode` and `getLocationsByCode`:** concatenate the chunks'
  results, keeping their existing filtering to the requested codes. Their "at
  most 100" limit (the shared constant in `lib/regions/lookup.ts`) stops being a
  throw and their doc notes go away.
- An abort or any chunk's error fails the whole call (`Promise.all` semantics).
- ≤ 100 codes (and no `external_id`) stay exactly one request, unchanged.
- Add one doc sentence: to get every region of a type inside an area, use
  `within` (one request, no code list) instead of listing codes.
- Tests (stubbed fetch): 250 codes → 3 requests with the right codes each;
  duplicates removed; merged features in order; the signal reaches every chunk;
  one failing chunk rejects the call.

### 2c. `calenviroscreen/` module

A new `lib/calenviroscreen/` following the domain layout (`mod.ts`,
`mod_test.ts`, `types.ts`, `schemas/`), exported from `deno.json` like the other
modules.

```ts
getCalEnviroScreen(version, query?, options?)   // GET calenviroscreen/<version>/
getCalEnviroScreenTract(version, tract, options?) // GET calenviroscreen/<version>/<tract>/
```

- **`version` is required:** `"4.0"` or `"5.0"`, no default (coordinator,
  2026-11-04: let metadata decide later). The return type follows the version
  (overloads or a generic keyed by version): CES 4.0 and 5.0 have separate
  schemas, because their fields differ (5.0 adds `zipcode`, `approx_loc`,
  `county`, `region_name`, `pol_small_ats*`, `char_diabetes*`, and gives
  demographics as `*_pct` percentages where 4.0 gives counts). Derive the
  schemas from the serializers in `camp/api/v2/ces/serializers.py`, field for
  field, nullable where the model field is `null=True`.
- **Query:**
  - `region_id` (a region sqid), and `within_mode` (`RegionsWithinMode` from
    `lib/regions/types.ts`; absent = the server's touching default).
  - `year` (`"2010"` or `"2020"`), 4.0 only (the type rejects it for 5.0): which
    tract boundaries the scores are keyed to; absent = the server's 2020.
- **Every page is fetched** (`paginatedApiCall`).
- **Tract detail** takes the tract's census code (the region's `external_id`).
  4.0 also takes `year` there (the server's detail honors it); builder's call
  whether that's a third argument or a small query object, consistent with the
  list.
- **Fixtures are hand-built** from the serializers: the local database has no
  CES rows (checked 2026-11-04), so stubbed-fetch tests cover the URL, params
  and schema; a live test runs only when the local server has rows (skipped with
  a note otherwise, like the other data-dependent steps).
- Add a `calenviroscreen` section to the `README` if the other modules have one.

### 2d. `getRegionDetails` buffer, and `buffers` in the meta schema

```ts
getRegionDetails(regionId: string, query?: { buffer?: number }, options?: RequestOptions)
```

- `buffer` is a plain `number` (miles), not `1 | 3 | 5`: the choices come from
  `getRegionsMeta().buffers`. Sent as `?buffer=<n>`; an invalid one is the
  server's 400.
- **Breaking:** `options` moves from second to third (see "Breaking changes in
  4.8.0"). Only the SDK's own tests call it with options today (checked
  monitor-map, mobile, web-widget, data-dashboard, map-sdk).
- `regionsMetaSchema` gains a required
  `buffers: Array<{ miles: number; label: string }>`. Wrap or expose it
  consistently with the existing `RegionsMeta` wrapper (it's an array, so no
  `.asIter` needed).

### 2e. `api-urls.md`

- Add `calenviroscreen/4.0/`, `4.0/<tract>/`, `5.0/`, `5.0/<tract>/` as checked;
  note `?region_id=&within_mode=` and 4.0's `?year=`.
- HMS: note the `?date=` / `?date__gte=&date__lte=` / `?region_id=` /
  `?density=` filters.
- Regions: add `?buffer=` on `regions/<region_id>/`, and `buffers` on
  `regions/meta/`.
- Every remaining unchecked line says why: excluded on purpose (and why), or not
  wrapped yet (and what would bring it in). Check each against the server's
  current URL conf; fix paths that changed. Don't wrap them.

## DEFERRED entries (data-dashboard `DEFERRED.md`, docs-only commits)

- **`calenviroscreen/meta/`**: indicator labels, units and versions, so clients
  don't hardcode CES field names or pick a version. **Revisit before** Release 3
  starter #7 or any CES display. Needs sjvair.com work.
- **Region GeoJSON lookups beyond about 10 requests:** batching sends one
  request per 100 codes. If a map regularly needs more than about 10, or the
  server slows under them, consider a POST lookup with codes in the body or a
  higher cap for simplified shapes. **Revisit when** that happens.
- Update the existing **"monitor-map: cancelling one-off loads"** entry only if
  the HMS change affects it (it mentions a date-picked HMS layer); also note
  monitor-map's call-site change under the step that moves it to 4.8 if one
  exists.

## Breaking changes in 4.8.0

`getHMSSmoke(options)`, `getHMSFire(options)` and
`getRegionDetails(id, options)` exist in stable 4.7.0; this spec moves `options`
to the end, a break inside a 4.x minor. **The user accepted this (2026-11-04):**
monitor-map and the mobile app already need updates before `develop` goes live,
so no compatibility bridge and no 5.0 hold. Consequences:

- The release notes for the beta and for 4.8.0 final list the three call
  changes.
- Plain-JS callers of the old shape don't error; they lose their request options
  (e.g. cancellation). TypeScript callers get a type error. Only monitor-map
  calls the old shape today (`src/lib/hms/hms.svelte.ts`,
  `tests/managers-signal.test.ts`; it pins `^4.7.0`, which accepts 4.8.0).
- Add to data-dashboard `DEFERRED.md` → "Production deploy of sjvair.com
  `develop` → `main`": monitor-map's HMS calls move to
  `getHMSSmoke(undefined, { signal })` / `getHMSFire(undefined, { signal })`
  when it moves to 4.8, before 4.8.0 final is in use there. Updating monitor-map
  itself is not part of this spec.

## Coordination and docs

- When each PR opens, and when a beta containing this is published (only with
  the user's yes for that specific release), tell the coordinator
  (data-dashboard-2c or its successor; check `ListAgents`) and map-sdk's session
  if one is running (it can drop its chunking and its direct HMS
  `paginatedApiCall` use).
- Update data-dashboard `TODO.md`'s spec 1 wrappers item ("Left: …") and
  "Release 1, step 3" status per its "Docs rules for the other sessions". The
  tracks table row is the coordinator's.

## Decided (who and when)

- HMS takes a query object (`{ date } | { start, end }`, plus `region_id`,
  `density`); the breaking call changes ship in 4.8.0 (the user, 2026-11-04; see
  "Breaking changes in 4.8.0").
- Fix the HMS range bug on the server in this spec (the user, 2026-11-04).
- CES: region list + tract detail, version required, no meta endpoint now
  (coordinator, 2026-11-04). Add `within_mode` to the CES filter, default
  unchanged (the user, 2026-11-04).
- `buffers` in `regions/meta/` (the user, 2026-11-04). Batching at 100 codes per
  request now, better lookup later via DEFERRED (the user, 2026-11-04).

## My calls (check these)

- Dates as `YYYY-MM-DD` strings, not `Date`.
- Leaving out HMS satellite/timestamp/method filters and CES score thresholds.
- Batching `getRegionsByCode` and `getLocationsByCode` too.
- `buffers` entries are `{ miles, label }` and include 0 ("Exact boundary").
- `getRegionDetails` takes `{ buffer }` as a query object in second place, like
  HMS.
- CES tests use hand-built fixtures because local has no CES data.
