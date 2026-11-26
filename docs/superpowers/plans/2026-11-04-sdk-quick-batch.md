# SDK quick batch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the SDK gaps the dashboard and map-sdk work around (HMS dates,
GeoJSON and by-code batching, CalEnviroScreen, region buffer, `api-urls.md`),
with the three small server changes they need.

**Architecture:** One sjvair.com PR into `develop` (HMS range fix, CES
`within_mode`, `buffers` in `regions/meta/`), then one sdk-js PR into
`release/4.8.0` that wraps it. SDK tests are stubbed-fetch tests asserting exact
URLs and params; live tests run against the local API and skip when it lacks
data.

**Tech Stack:** Django + resticus + PostGIS (pytest in the `sjvair-com-test`
image); Deno 2, TypeScript, Zod (sdk-js).

**Spec:** `docs/superpowers/specs/2026-11-04-sdk-quick-batch-design.md`
(approved by the user 2026-11-04). Read it with this plan; section numbers (1a,
2c…) refer to it.

## Global Constraints

- Nothing touches production: no Heroku, production logs, Sentry or data
  changes.
- Never stop, restart or swap `sjvaircom_web_1` or the Huey workers.
- Never merge into `develop`, `main` or `release/4.8.0`, push a `v*` tag,
  publish, or cut a beta without the user's explicit yes for that specific
  action.
- No Claude or AI attribution in commits, PRs or docs.
- No fallbacks for older server responses: `buffers` is required in
  `regionsMetaSchema`.
- Metadata is the source of truth: no hardcoded buffer list, CES version
  default, or density labels.
- The breaking call changes ship in 4.8.0 (the user, 2026-11-04):
  `getHMSSmoke(query?, options?)`, `getHMSFire(query?, options?)`,
  `getRegionDetails(regionId, query?, options?)`.
- sdk-js conventions (`CLAUDE.md`): Zod-derived types via `zinfer`,
  `mod_test.ts` names, module JSDoc with `@example Usage` and `@module`, search
  params as `Record<string, string | string[]>`.
- Never run `lib/account` tests (they send a real SMS).

## Review Focus

1. **Codes that differ only by whitespace or repeat**
   (`["06019", " 06019 ", "06019"]`): one request with one code. Test in Task 5.
2. **The 100-code boundary:** exactly 100 codes is one request, 101 is two.
   Tests in Tasks 5 and 6.
3. **An abort after some chunks have answered** rejects the whole call with the
   signal's reason, and no partial result comes back. Test in Task 5.
4. **A month of HMS rows spanning several pages:** every page request carries
   the same date params, and all pages come back. Test in Task 7.
5. **`?date=` sent empty alongside a range** (a client building params naively)
   still counts as no `date`: the range applies, and the today default doesn't.
   Test in Task 1.

---

## Setup (both repos)

- sjvair.com:
  `git -C /home/alex/workspace/sjvair/sjvair.com worktree add -b feature/sdk-quick-batch .worktrees/sdk-quick-batch origin/develop`;
  copy `.env` and `.env.test` from the main checkout into it. From the worktree,
  the test command (`$PYTEST` below) is:
  `podman run --rm --network sjvaircom_sjvair-net --env-file .env.test -e BAM_MIRROR_ENABLED=0 -e TWILIO_AUTH_TOKEN=test-token -v $PWD:/app:z -v ~/workspace/django-resticus/.worktrees/session-csrf/resticus:/usr/local/lib/python3.14/site-packages/resticus:ro,z -w /app sjvair-com-test:latest pytest <target>`
  (from the location-search plan; ignore the trailing "not a git repository"
  line).
- sdk-js:
  `git -C /home/alex/workspace/sjvair/sdk-js worktree add -b feature/sdk-quick-batch .worktrees/sdk-quick-batch origin/release/4.8.0`;
  copy `.env` in. Checks: `deno fmt --check && deno lint && deno check mod.ts`.
  Unit tests:
  `deno test --allow-net --allow-env --allow-read --env-file=.env <file>`.

---

## Part 1: sjvair.com (`feature/sdk-quick-batch`)

### Task 1: HMS date ranges work without `date` (spec 1a)

**Files:**

- Modify: `camp/api/v2/hms/endpoints.py` (`SmokeList.get_queryset`,
  `FireList.get_queryset`)
- Test: `camp/api/v2/hms/tests.py`

**Interfaces:**

- Produces: `has_date_filter(params) -> bool` in `camp/api/v2/hms/endpoints.py`.
  True when any of `date`, `date__gt`, `date__gte`, `date__lt`, `date__lte` has
  a non-empty value. Both lists apply `get_default_date_queryset` only when it's
  False.

- [ ] **Step 1: Write the failing tests.** Add them to the smoke and fire list
      test classes, using the file's existing helpers that create records
      `days_offset` from today:
  - `test_date_range_without_date`: records at offsets -3, -2, -1 and 0;
    `{'date__gte': <-3>, 'date__lte': <-1>}` → exactly the three records from -3
    through -1 (both ends included, today excluded).
  - `test_open_ended_range`: `{'date__gte': <-2>}` → the -2, -1 and 0 records.
  - `test_empty_date_with_range`:
    `{'date': '', 'date__gte': <-3>, 'date__lte': <-1>}` → the same three
    records as the first test.
  - `test_no_date_params_defaults_to_today`: if the existing tests don't already
    cover it, no params → today's records only.
- [ ] **Step 2: Run** `$PYTEST camp/api/v2/hms/tests.py -v`. Expected: the range
      tests FAIL (empty or today-only results).
- [ ] **Step 3: Implement** `has_date_filter` and use it in both
      `get_queryset`s; update both lists' docstrings (say that any date filter
      replaces the today default).
- [ ] **Step 4: Run** `$PYTEST camp/api/v2/hms/tests.py -v`. Expected: all PASS.
- [ ] **Step 5: Commit** `fix(hms): honor date ranges without an exact date`.

### Task 2: `within_mode` on the CES region filter (spec 1b)

**Files:**

- Modify: `camp/apps/regions/querysets.py` (move the area-fraction logic to
  module level)
- Modify: `camp/api/v2/ces/filters.py`, `camp/api/v2/ces/endpoints.py` (the 400)
- Test: `camp/api/v2/ces/tests.py`; `camp/api/v2/regions/tests.py` must still
  pass unchanged

**Interfaces:**

- Produces, in `camp/apps/regions/querysets.py`:
  - `CONTAINED_MIN_FRACTION = 0.99` and `OVERLAPS_MIN_FRACTION = 0.01`;
  - `area_fraction_inside(queryset, geometry, min_fraction)`. It works on any
    queryset whose model has `boundary__geometry`, which includes Region, CES4
    and CES5. `overlap_area` already uses that path.
  - `RegionQuerySet.contained_within`/`overlapping` keep their signatures and
    defaults and delegate to it.
- Produces: `WITHIN_MODES = ('contained', 'overlaps')`, imported from
  `camp/api/v2/regions/endpoints.py` (or moved to a shared spot both import; no
  copy).

- [ ] **Step 1: Write the failing tests.** Add a `within_mode` test class per
      version (CES4, CES5), reusing the `calenviroscreen` fixture. Tracts 1.01
      (lon -119.8 to -119.7) and 1.02 (lon -119.7 to -119.6) share an edge at
      -119.7; both cover lat 36.7 to 36.8.
  - Region `EXACT_1_01` = tract 1.01's square:
    - absent → both tracts (1.02 touches);
    - `contained` → 1.01 only;
    - `overlaps` → 1.01 only.
  - Region `STRADDLE` = lon -119.8 to -119.65 (half of 1.02):
    - `contained` → 1.01 only;
    - `overlaps` → both.
  - `within_mode=sideways` → 400, body
    `{'error': 'within_mode must be contained or overlaps.'}`.
  - `within_mode=contained` without `region_id` → 200, all records (ignored,
    like the regions list).
  - CES4 with `year=2010` and `contained` measures the 2010 records' own
    boundaries. Assert it returns the 2010 record for the tract inside.
- [ ] **Step 2: Run** `$PYTEST camp/api/v2/ces/tests.py -v`. Expected: the new
      tests FAIL.
- [ ] **Step 3: Implement.**
  - Refactor the querysets first, so
    `$PYTEST camp/api/v2/regions/tests.py camp/apps/regions/tests -v` stays
    green.
  - Then give `CES4Filter`/`CES5Filter` a declared `within_mode` CharFilter
    (method `noop`, with help text, so it shows in OpenAPI).
  - `filter_region_id` reads `self.data.get('within_mode')`:
    - absent → intersects, as today;
    - `contained`/`overlaps` → `area_fraction_inside` with the matching
      constant.
  - The unknown-mode 400 goes in each list endpoint's `get`, the way
    `RegionList` does it (`camp/api/v2/regions/endpoints.py:74`).
- [ ] **Step 4: Run**
      `$PYTEST camp/api/v2/ces/tests.py camp/api/v2/regions/tests.py camp/apps/regions/tests -v`.
      Expected: all PASS.
- [ ] **Step 5: Commit** `feat(ces): within_mode on the region filter`.

### Task 3: `buffers` in `regions/meta/` (spec 1c)

**Files:**

- Modify: `camp/api/v2/regions/endpoints.py` (`RegionMetaEndpoint`)
- Test: `camp/api/v2/regions/tests.py` (`RegionMetaTests`)

**Interfaces:**

- Produces: `regions/meta/` `data.buffers` =
  `[{'miles': m, 'label': str(BUFFER_LABELS[m])} for m in BUFFERS]`. Today that
  is 0 "Exact boundary", 1 "+1 mile", 3 "+3 miles", 5 "+5 miles".

- [ ] **Step 1: Write the failing test** `test_buffers`:
      `content['data']['buffers']` equals the four-entry list above, and
      `[b['miles'] for b in buffers] == list(shapes.BUFFERS)`.
- [ ] **Step 2: Run**
      `$PYTEST camp/api/v2/regions/tests.py -k RegionMetaTests -v`. Expected:
      FAIL (KeyError).
- [ ] **Step 3: Implement** `get_buffers()` on `RegionMetaEndpoint` and add it
      to `get()`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit**
      `feat(regions): list the allowed buffers in regions/meta`.

### Task 4: Server suite and PR

- [ ] **Step 1: Run the full suite:**
      `$PYTEST -n 4 --dist loadscope 2>&1 | tee <scratchpad>/sdk-quick-batch-server.log`.
      Expected: 0 failed. Any failure outside the touched apps: check whether
      `develop` already fails the same way before calling it unrelated.
- [ ] **Step 2: Push and open the PR into `develop`.** The body covers:
  - the three changes;
  - the HMS bug, and why the CES default is unchanged (the endpoint is in
    production);
  - that sdk-js's PR depends on this one.

  Don't merge it. Tell the coordinator (check `ListAgents`) that the PR is open.

---

## Part 2: sdk-js (`feature/sdk-quick-batch`)

### Task 5: By-code batching helper; `getRegionsByCode` and `getLocationsByCode` (spec 2b)

**Files:**

- Modify: `lib/regions/lookup.ts`, `lib/regions/get_regions_by_code.ts`,
  `lib/regions/get_locations_by_code.ts`
- Test: `lib/regions/lookup_by_code_test.ts`

**Interfaces:**

- Produces, in `lib/regions/lookup.ts` (internal, not exported from `mod.ts`):
  - `chunkCodes(codes: Array<string>): Array<Array<string>>`: trims, drops
    duplicates and empty strings, keeps first-seen order, and splits into chunks
    of `LOOKUP_MAX_CODES`. `[]` gives `[]`.
  - `fetchChunked<T>(codes: Array<string>, fetchChunk: (chunk: Array<string>) => Promise<T>): Promise<Array<T>>`:
    `Promise.all` over the chunks.
- Both lookups stop throwing over 100 codes and keep their final filter to the
  requested codes. Their docs lose "at most 100".

- [ ] **Step 1: Write the failing tests** (stubbed fetch):
  - 250 distinct codes → 3 requests, with 100, 100 and 50 codes in each
    `external_id`, in order; the result is all of them.
  - Exactly 100 codes → 1 request; 101 → 2.
  - `["06019", " 06019 ", "06019"]` → 1 request, `external_id=06019`.
  - A signal aborted after the first chunk's response → rejects with that
    signal's reason. Use a responder that aborts the controller on call 0.
  - One chunk responding 500 → the call rejects.
  - The same cases for `getLocationsByCode`, aliases included: a location
    matched by an alias is kept.
  - Remove the existing "more than 100 throws" tests.
- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --allow-read --env-file=.env lib/regions/lookup_by_code_test.ts`.
      Expected: FAIL.
- [ ] **Step 3: Implement** the helpers and use them in both lookups.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(regions): batch by-code lookups over 100 codes`.

### Task 6: `getRegionsGeoJSON` batching (spec 2b)

**Files:**

- Modify: `lib/regions/get_regions_geojson.ts`
- Test: new `lib/regions/get_regions_geojson_test.ts` (or the existing GeoJSON
  test file if there is one), with fixture
  `lib/regions/fixtures/regions_geojson.json`

**Interfaces:**

- Consumes: `chunkCodes`, `fetchChunked` (Task 5).
- Behavior:
  - An array `external_id` is batched. A string `external_id` is sent as-is, and
    no `external_id` stays one request.
  - An empty array returns `{ type: "FeatureCollection", features: [] }` without
    a request.
  - The merged result is
    `{ type: "FeatureCollection", features: [...chunk0, ...chunk1, ...] }`,
    features unchanged. Any other top-level keys come from the first chunk.

- [ ] **Step 1: Write the failing tests:**
  - 250 codes → 3 requests, each carrying the other params unchanged (`type`,
    `simplify=1`); features concatenated in chunk order.
  - 100 codes → 1 request.
  - `[]` → no request, empty collection.
  - The signal reaches every chunk.
  - One failing chunk rejects.
- [ ] **Step 2: Run** the file. Expected: FAIL.
- [ ] **Step 3: Implement.** Also add the doc sentence: to get every region of a
      type inside an area, use `within` (one request) instead of listing codes.
- [ ] **Step 4: Run** the file. Expected: PASS.
- [ ] **Step 5: Commit** `feat(regions): batch regions GeoJSON code lists`.

### Task 7: HMS smoke and fire by date (spec 2a)

**Files:**

- Create: `lib/hms/query.ts`
- Modify: `lib/hms/smoke/get_smoke.ts`, `lib/hms/fire/get_fire.ts`,
  `lib/hms/smoke/types.ts`, `lib/hms/fire/types.ts`, `lib/hms/mod.ts` (re-export
  the query types), `lib/request_options_forwarding_test.ts:103,105`
- Test: new `lib/hms/query_test.ts` (stubbed); the existing live
  `lib/hms/*/mod_test.ts` keep passing

**Interfaces:**

- Produces, in `lib/hms/query.ts`:
  - `type HMSDateQuery = { date?: string; start?: never; end?: never } | { date?: never; start?: string; end?: string }`;
  - `hmsSearchParams(query?: HMSFireQuery | HMSSmokeQuery): Record<string, string>`.
    It maps `date`→`date`, `start`→`date__gte`, `end`→`date__lte`,
    `region_id`→`region_id` and `density`→`density`, omitting undefined fields.
- Produces: `HMSFireQuery = HMSDateQuery & { region_id?: string }` (in
  `lib/hms/fire/types.ts`) and
  `HMSSmokeQuery = HMSFireQuery & { density?: HMSSmokeGeoJSON["density"] }` (in
  `lib/hms/smoke/types.ts`).
- Produces:
  - `getHMSSmoke(query?: HMSSmokeQuery, options?: RequestOptions): Promise<Array<HMSSmokeGeoJSON>>`;
  - `getHMSFire(query?: HMSFireQuery, options?: RequestOptions): Promise<Array<HMSFireGeoJSON>>`.

  Both use `paginatedApiCall` with `searchParams`.

- [ ] **Step 1: Write the failing tests:**
  - `{ date: "2025-09-07" }` → `?date=2025-09-07` only.
  - `{ start: "2025-09-01", end: "2025-09-30", region_id: "5nO2A8", density: "heavy" }`
    (smoke) → `date__gte=2025-09-01`, `date__lte=2025-09-30`, `region_id=5nO2A8`
    and `density=heavy`, and no `date`.
  - `{ start: "2025-09-01" }` → `date__gte` only.
  - No query → no params.
  - A first page with `pages: 3, has_next_page: true` → 3 requests, each with
    the same date params plus `page=2` and `page=3`. Results concatenated in
    page order.
  - The signal reaches every page request.
  - A type-level check (`// @ts-expect-error`) that `{ date: "x", start: "y" }`
    is rejected.
- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --allow-read --env-file=.env lib/hms/query_test.ts`.
      Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Update both functions' JSDoc examples to show a day and a range. Dates are
    `YYYY-MM-DD` Pacific days, and `start`/`end` include both ends.
  - Change `lib/request_options_forwarding_test.ts` lines 103 and 105 to
    `getHMSFire(undefined, o)` and `getHMSSmoke(undefined, o)`.
- [ ] **Step 4: Run** the new test, `lib/request_options_forwarding_test.ts` and
      `lib/hms`. Expected: PASS. Live HMS steps may skip locally when there's no
      data for today.
- [ ] **Step 5: Commit**
      `feat(hms): filter smoke and fire by date, range, region and density`.

### Task 8: Region buffer and `buffers` metadata (spec 2d)

**Files:**

- Modify: `lib/regions/get_region_details.ts`,
  `lib/regions/schemas/regions_meta.ts`, `lib/regions/get_regions_meta.ts` (the
  `RegionsMeta` wrapper), `lib/regions/types.ts`,
  `lib/regions/fixtures/regions_meta.json`,
  `lib/request_options_forwarding_test.ts:191`
- Test: `lib/regions/mod_test.ts` (live) and a stubbed test file
  (`lib/regions/region_details_test.ts`)

**Interfaces:**

- Produces:
  - `regionBufferSchema = z.object({ miles: z.number(), label: z.string() })`;
  - `regionsMetaSchema.buffers: z.array(regionBufferSchema)`, required;
  - the type `RegionBuffer`, and a `RegionsMeta.buffers` getter returning
    `Array<RegionBuffer>`. No `.asIter` entry, since it's already an array.
- Produces:
  - `getRegionDetails(regionId: string, query?: RegionDetailsQuery, options?: RequestOptions): Promise<RegionData>`;
  - `RegionDetailsQuery = { buffer?: number }`, sent as `buffer=<n>` when
    defined.

- [ ] **Step 1: Write the failing tests:**
  - `getRegionDetails("r", { buffer: 3 })` → `regions/r/?buffer=3`.
  - `getRegionDetails("r")` → no `buffer` param.
  - The meta fixture with `buffers` validates.
  - The same fixture without `buffers` fails validation.
  - `new RegionsMeta(fixture).buffers` has 4 entries.

  Update the fixture's `buffers` to the exact list from Task 3.
- [ ] **Step 2: Run** the stubbed file. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Update the JSDoc example to show `{ buffer: 3 }`, with the allowed values
    read from `getRegionsMeta()`.
  - Change forwarding test line 191 to `getRegionDetails("r", undefined, o)`.
- [ ] **Step 4: Run** the stubbed file and the forwarding test. Expected: PASS.
      `lib/regions/mod_test.ts`'s live meta step fails until Task 3's PR is
      merged into `develop`. That's expected: note it, don't weaken the schema.
- [ ] **Step 5: Commit**
      `feat(regions): buffer on region details, buffers in regions meta`.

### Task 9: `calenviroscreen/` module (spec 2c)

**Files:**

- Create:
  - `lib/calenviroscreen/mod.ts`
  - `lib/calenviroscreen/get_calenviroscreen.ts`
  - `lib/calenviroscreen/get_calenviroscreen_tract.ts`
  - `lib/calenviroscreen/types.ts`
  - `lib/calenviroscreen/schemas/{ces4.ts,ces5.ts,mod.ts}`
  - `lib/calenviroscreen/fixtures/{ces4_list.json,ces5_list.json}`
  - `lib/calenviroscreen/mod_test.ts`
- Modify: `deno.json` exports (`./calenviroscreen`, plus one entry per file,
  like `./calheatscore`), `mod.ts` (if the root re-exports modules),
  `lib/request_options_forwarding_test.ts` (add both)

**Interfaces:**

- Consumes: `RegionsWithinMode` from `lib/regions/types.ts`.
- Produces:
  - `ces4RecordSchema` and `ces5RecordSchema`: field for field from
    `camp/api/v2/ces/serializers.py`. Use `.nullable()` where the model field
    (`camp/apps/ces/models.py`) is `null=True`. `id`, `tract` and `census_year`
    are strings (`census_year` is the boundary version, e.g. `"2020"`).
    `dac_category` is the display label string.
  - The types `CES4Record` and `CES5Record`, and:
    - `type CESVersion = "4.0" | "5.0"`;
    - `interface CESRecordByVersion { "4.0": CES4Record; "5.0": CES5Record }`;
    - `CES4Query = { region_id?: string; within_mode?: RegionsWithinMode; year?: "2010" | "2020" }`;
    - `CES5Query = Omit<CES4Query, "year">`;
    - `interface CESQueryByVersion { "4.0": CES4Query; "5.0": CES5Query }`.
  - `getCalEnviroScreen<V extends CESVersion>(version: V, query?: CESQueryByVersion[V], options?: RequestOptions): Promise<Array<CESRecordByVersion[V]>>`.
    It uses `paginatedApiCall`, URL `calenviroscreen/<version>`.
  - `getCalEnviroScreenTract<V extends CESVersion>(version: V, tract: string, query?: V extends "4.0" ? { year?: "2010" | "2020" } : never, options?: RequestOptions): Promise<CESRecordByVersion[V]>`.
    It uses `jsonCall`, URL `calenviroscreen/<version>/<tract>`.

- [ ] **Step 1: Build the fixtures and write the failing tests.**
  - Fixtures: two hand-built records per version, every serializer field
    present, and at least one nullable field `null`. Wrap them in the paginated
    envelope (`data`, `page`, `count`, `pages`, `has_next_page`,
    `has_previous_page`).
  - Tests (stubbed):
    - both fixtures validate against their schemas;
    - the 4.0 fixture fails the 5.0 schema;
    - `getCalEnviroScreen("5.0", { region_id: "abc", within_mode: "contained" })`
      → `calenviroscreen/5.0/?region_id=abc&within_mode=contained`;
    - `getCalEnviroScreen("4.0", { year: "2010" })` → `?year=2010`;
    - `getCalEnviroScreen("4.0")` → no params;
    - a 2-page response is fully fetched;
    - `getCalEnviroScreenTract("4.0", "06019000101", { year: "2010" })` →
      `calenviroscreen/4.0/06019000101/?year=2010`;
    - `// @ts-expect-error` on `getCalEnviroScreen("5.0", { year: "2020" })`.
  - Live step: `getCalEnviroScreen("5.0")` validates when the server has rows.
    Otherwise skip with `console.warn`, like other data-dependent steps (local
    has none, checked 2026-11-04).
- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --allow-read --env-file=.env lib/calenviroscreen/mod_test.ts`.
      Expected: FAIL.
- [ ] **Step 3: Implement.** Module JSDoc: say that the version is required and
      that labels and units will come from a future `calenviroscreen/meta/`.
- [ ] **Step 4: Run** the same command and `deno check mod.ts`. Expected: PASS.
- [ ] **Step 5: Commit**
      `feat(calenviroscreen): tract scores by region and by tract`.

### Task 10: `api-urls.md`, checks, PR (spec 2e)

**Files:** `api-urls.md`, `README.md` (only if it has per-module sections; it
currently has "Request options and defaults" and "Documents", so likely no
change)

- [ ] **Step 1: Update `api-urls.md` per spec 2e.**
  - Check every unchecked line against the server's URL conf
    (`camp/api/v2/urls.py` and each app's `urls.py` in the sjvair.com worktree).
  - Each remaining unchecked line gets a reason (excluded on purpose, and why;
    or not wrapped yet, and what would bring it in).
  - Fix any paths that changed.
- [ ] **Step 2: Run** `deno fmt --check && deno lint && deno check mod.ts` and
      `deno test --allow-net --allow-env --allow-read --env-file=.env --ignore=lib/account,lib/documents`.
      Expected: all pass, except steps that need data local lacks (`closest/`,
      CES live, HMS today) and the `regions/meta` live step (it needs Task 3's
      PR merged). List each one in the PR.
- [ ] **Step 3: Commit**
      `docs: api-urls for calenviroscreen, HMS filters, region buffer`.
- [ ] **Step 4: Push and open the PR into `release/4.8.0`.** The body covers:
  - the three breaking call changes and their new forms (for the release notes);
  - that it needs the sjvair.com PR (link it) merged into `develop`, and a
    server on that branch for the betas;
  - the live steps that were skipped.

  Don't merge, tag or publish. Tell the coordinator, plus map-sdk's session if
  one is running (it can drop its chunking and its direct HMS
  `paginatedApiCall`).

### Task 11: Dashboard docs (data-dashboard `main`, docs-only)

**Files:** in
`git -C /home/alex/workspace/sjvair/data-dashboard worktree add .worktrees/docs-sdk-quick-batch origin/main`:
`TODO.md`, `DEFERRED.md`

- [ ] **Step 1: Re-read each file right before editing it.**
  - **`TODO.md`:** update the spec 1 wrappers item's "Left: …" part and the
    "Release 1, step 3" status (spec 4: PR links and state). Don't edit the
    tracks table; tell the coordinator instead.
  - **`DEFERRED.md`**, entries with why and a revisit trigger, worded per the
    spec's "DEFERRED entries":
    - `calenviroscreen/meta/`;
    - region GeoJSON lookups beyond about 10 requests;
    - the monitor-map HMS call change, under "Production deploy of sjvair.com
      `develop` → `main`".
- [ ] **Step 2: Format and push.**
      `../../node_modules/.bin/prettier --write TODO.md DEFERRED.md`, rebase on
      `origin/main`, commit (`docs: SDK quick batch status and deferrals`), push
      to `main`.
