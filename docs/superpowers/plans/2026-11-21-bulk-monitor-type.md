# Bulk monitor `type`, catalog `monitor_types`, valley pesticides Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap sjvair.com #350 in `@sjvair/sdk` 5.0.0-beta.16: a `type` option
on the bulk monitor summaries, `monitor_types` on catalog entries, and
valley-wide `getPesticidesForPlace(null, ...)`.

**Architecture:** Three independent, additive changes to existing modules, each
with stubbed-fetch unit tests and a live step against the local stack.

**Tech Stack:** Deno 2, TypeScript, Zod, JSR.

**Spec:** `docs/superpowers/specs/2026-11-21-bulk-monitor-type-design.md`

## Global Constraints

- Branch `feature/bulk-monitor-type` (from `origin/release/5.0.0`); the PR goes
  into `release/5.0.0`.
- No commit trailers, no AI attribution anywhere (no `Co-Authored-By`,
  `Claude-Session` or "Generated with" lines).
- No fallbacks for older server responses: `monitor_types` is required.
- Unit runs: `deno test --allow-net --allow-env --env-file <file>`. Never run
  the bare full suite: always pass `--ignore=lib/account/mod_test.ts` (it writes
  the shared DB and sends SMS).
- Live tests warn on empty data and never require counts.
- Run `deno fmt` and `deno lint` before each commit; afterwards recheck code
  spans, `@ts-expect-error` placement and CHANGELOG wording.
- Don't push, tag, publish, or touch any other repo.

## Review Focus

1. `type: []` or `type: ""` must send no `type` param (the server ignores
   blanks, but a bare `?type=` is noise). Test in Task 2.
2. `getPesticidesForPlace(county)` must still type `result.place` as non-null
   (no new `!` for existing callers). Type test in Task 3.
3. A land-use region still throws before any request (unchanged
   `placeSearchParams`). Existing test; keep it passing in Task 3.
4. `type` must combine with `region` (both repeated params). Test in Task 2.
5. Catalog entries without monitors must parse with `monitor_types: null`. Test
   in Task 1.

---

### Task 1: Catalog `monitor_types`

**Files:**

- Modify: `lib/meta/schemas/dataset_catalog.ts` (interface
  `DatasetCatalogEntrySchema` and `datasetCatalogEntrySchema`)
- Modify: `lib/meta/fixtures/dataset_catalog.json`
- Test: `lib/meta/mod_test.ts`

**Interfaces:**

- Produces: `DatasetCatalogEntry.monitor_types: Array<string> | null` (via
  zinfer). Doc comment: "The monitor type ids that produce this dataset, sorted
  (values for the bulk monitor summaries' `type`), or null when it isn't made by
  monitors."

- [ ] **Step 1: Write the failing tests.** In `assertCatalogContents` (used by
      the fixture and live steps), add:
  ```ts
  const weather = catalog.datasets.find((d) => d.id === "weather");
  assertExists(weather, "No weather dataset in the catalog");
  assertEquals(weather.monitor_types, ["cimis"]);
  assert(airQuality.monitor_types?.includes("purpleair"));
  assertEquals(airQuality.monitor_types?.includes("cimis"), false);
  const smoke = catalog.datasets.find((d) => d.id === "hms-smoke");
  assertEquals(smoke?.monitor_types, null);
  ```
- [ ] **Step 2: Update the fixture as text.** Insert `"monitor_types": [...]` in
      each of the 11 entries, using the values from the server snapshot
      `git -C ../sjvair.com show origin/feature/bulk-monitor-type:camp/api/v2/meta/tests/catalog_snapshot.json`.
      Weather is `["cimis"]`. Air-quality is
      `["airgradient","airnow","aqlite","aqview","bam1022","purpleair","vozbox"]`.
      The rest are `null`. Don't round-trip the file through `JSON.parse`.
- [ ] **Step 3: Run**
      `deno test --allow-net --allow-env --env-file lib/meta/mod_test.ts`.
      Expect the fixture step to FAIL, because the type has no `monitor_types`
      yet.
- [ ] **Step 4: Add `monitor_types: z.array(z.string()).nullable()`** to the
      schema and to its interface (`z.ZodNullable<z.ZodArray<z.ZodString>>`).
- [ ] **Step 5: Run again.** Expect PASS. The live `GET meta/datasets/` step
      passes only once the stack runs #350. Before then it fails on the missing
      field, and that's expected.
- [ ] **Step 6: Commit** `feat(meta): monitor_types on dataset catalog entries`.

### Task 2: Bulk `type` option

**Files:**

- Modify: `lib/monitors/types.ts` (add `MonitorTypeId` after `MonitorType`)
- Modify: `lib/monitors/get_monitor_summaries_bulk.ts:56-82` (config),
  `getBulkScopeSearchParams`, module JSDoc
- Test: `lib/monitors/mod_test.ts`

**Interfaces:**

- Produces: `export type MonitorTypeId = MonitorType | (string & {})` exported
  from `lib/monitors/types.ts` (and so from `@sjvair/sdk/monitors`). Doc it as:
  "a monitor type id. The known ids are suggested, but any string is accepted
  (the `monitors/meta/` `type` values, and the catalog's `monitor_types`)."
- Produces:
  `MonitorSummaryBulkRequestConfig.type?: MonitorTypeId | Array<MonitorTypeId>`.
  JSDoc: restricts results to these monitor types (the `monitors/meta/`
  `monitors[*].type` keys, or a dataset's `monitor_types`); the opt-in `cimis`
  is returned only when named, as its raw series, for the weather entry types it
  summarizes; an unknown type is a 400 (`errors.type[0].code` is
  `"invalid_choice"`); combines with `region`, `bbox` and `processor`.

- [ ] **Step 1: Write the failing unit tests.** Put them in the "Module:
      Monitors request params (stubbed fetch)" block, using `emptyPage`:
  - `"bulk summaries send one type"`:
    `getMonitorSummariesBulkDaily({ entryType: "pm25", start: "2026-01-01", end: "2026-01-02", type: "purpleair" })`.
    Assert `params.getAll("type")` equals `["purpleair"]`.
  - `"bulk summaries send several types with regions"`:
    `type: ["purpleair", "airnow"], region: ["a", "b"]`. Assert `getAll("type")`
    is `["purpleair","airnow"]` and `getAll("region")` is `["a","b"]`.
  - `"bulk open days send type"`:
    `getMonitorSummariesBulkDailyOpen({ entryType: "temperature", type: "cimis" })`.
    Assert `getAll("type")` is `["cimis"]`.
  - `"bulk summaries omit an empty type"`: once with `type: []` and once with
    `type: ""`. Assert `params.has("type") === false` both times.
  - A meta string needs no cast: `const id: string = "purpleair"; type: id`
    compiles.
- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --env-file lib/monitors/mod_test.ts --filter "stubbed fetch"`.
      Expect a type-check FAIL, because `type` isn't in the config.
- [ ] **Step 3: Implement.** Add the field. In `getBulkScopeSearchParams`, send
      `type` only when the value is a non-empty string or a non-empty array, as
      a string or a copied array (same as `region`). Add a `type` line to the
      module's `@example`.
- [ ] **Step 4: Run.** Expect PASS.
- [ ] **Step 5: Add live steps** after the bulk daily step in the network test.
      Each one validates with `validateMonitorWithSummaries` and warns on empty:
  - `type: "purpleair"` (pm25, last 7 days): every
    `monitor.type === "purpleair"`.
  - `type: "cimis"` with `entryType: "temperature"` (last 7 days): every
    `monitor.type === "cimis"`.
  - `type: "nope"`: `assertRejects`. The error's `cause.result.status` is 400
    and `cause.details.type[0].code` is `"invalid_choice"`. Check how other 400
    tests in this file read `cause` and do the same.
  - Open days, with `ignore: isRemote`:
    `getMonitorSummariesBulkDailyOpen({ entryType: "pm25", type: "purpleair" })`,
    and every monitor's type is purpleair.
- [ ] **Step 6: Run the live steps** against the local stack, once the
      coordinator says it runs #350 (`--filter "Monitors"`). Expect PASS or
      warnings. Before #350 the narrowing and 400 steps fail, which shows they
      really test the server.
- [ ] **Step 7: Commit**
      `feat(monitors): type option on bulk monitor summaries`.

### Task 3: Valley-wide pesticide use

**Files:**

- Modify: `lib/pesticides/schemas/pesticides_for_place.ts:67-81`
- Modify: `lib/pesticides/get_pesticides_for_place.ts:43-75` (overloads, JSDoc)
- Create: `lib/pesticides/fixtures/pesticides_for_place_valley.json`
- Test: `lib/pesticides/mod_test.ts`

**Interfaces:**

- Consumes: `PlaceRef`, `placeSearchParams` (unchanged), `Place` (the zinfer of
  `placeSchema`, from `lib/meta/types.ts`; check its exported name).
- Produces:
  ```ts
  export function getPesticidesForPlace(
    place: PlaceRef,
    filters?: PesticidesForPlaceFilters,
    options?: RequestOptions,
  ): Promise<PesticidesForPlace & { place: Place }>;
  export function getPesticidesForPlace(
    place: null,
    filters?: PesticidesForPlaceFilters,
    options?: RequestOptions,
  ): Promise<PesticidesForPlace & { place: null }>;
  ```
  Both use one implementation taking `PlaceRef | null`.
  `PesticidesForPlace.place` is now `Place | null`. Document `null` in
  `@param place` as "the whole valley (every county the import keeps), with
  `place: null` in the result", and add an `@example` for it.

- [ ] **Step 1: Write the failing unit tests** in "Module: pesticides for a
      place":
  - `"null sends no place params"`: stub with the valley fixture, call
    `getPesticidesForPlace(null, { year__gte: 2022 })`, and assert the param
    keys are exactly `["year__gte"]` and `result.place === null`.
  - `"the valley fixture matches the schema"`:
    `validatePlace(valleyFixture.data)`.
  - Type checks: `const p: Place = (await getPesticidesForPlace(county)).place;`
    compiles. `// @ts-expect-error` on
    `const q: Place = (await getPesticidesForPlace(null)).place;`.
- [ ] **Step 2: Create the valley fixture.** Use `placeFixture` with
      `"place": null`, trimmed to a couple of months and years. Re-capture it
      from the stack once it runs #350:
      `curl -s 'http://127.0.0.1:8000/api/2.0/pesticides/place/?year__gte=2022&_cc=1'`,
      trimmed the same way.
- [ ] **Step 3: Run**
      `deno test --allow-net --allow-env --env-file lib/pesticides/mod_test.ts --filter "for a place"`.
      Expect FAIL (type error on `null`, schema rejects `place: null`).
- [ ] **Step 4: Implement.** Make the schema `place: placeSchema.nullable()` and
      its interface `z.ZodNullable<typeof placeSchema>`. Add the overloads. The
      body calls `placeSearchParams` only when `place !== null`.
- [ ] **Step 5: Run.** Expect PASS, including the existing land-use, abort and
      filter-error steps.
- [ ] **Step 6: Add live steps** next to "GET pesticides/place/ for Fresno
      County", with the same `isUnavailable` skip:
  - `"GET pesticides/place/ for the valley"`:
    `getPesticidesForPlace(null, { year__gte: 2022 })`. Validate it and assert
    `result.place === null`. If `years` is empty, warn.
  - `"GET pesticides/place/ with half a region is a 400"`: send `apiCall` with
    `searchParams: { region_type: "county" }` directly (the SDK can't build
    this), and assert it rejects with status 400.
- [ ] **Step 7: Commit**
      `feat(pesticides): valley-wide getPesticidesForPlace(null)`.

### Task 4: CHANGELOG, api-urls, verification

**Files:**

- Modify: `CHANGELOG.md` (5.0.0 section: the Betas paragraph, `### Breaking`,
  `### Added`)
- Modify: `api-urls.md`

- [ ] **Step 1: CHANGELOG.**
  - Betas paragraph: append
    `**5.0.0-beta.16** (date TBD at release): the bulk monitor`type`option, catalog`monitor_types`and valley-wide pesticide use (#PR, for sjvair.com #350).`
    Fill in the date and PR number when known.
  - Breaking: "`PesticidesForPlace.place` (and `pesticidesForPlaceSchema`) is
    `Place | null`: `null` for valley-wide use. `getPesticidesForPlace` with a
    place still types `place` as non-null, but code that takes a
    `PesticidesForPlace` and reads `.place` must handle `null`. Needs a server
    running sjvair.com #350. (from beta.16)"
  - Added: the `type` option and `MonitorTypeId`,
    `DatasetCatalogEntry.monitor_types`, and `getPesticidesForPlace(null)`.
- [ ] **Step 2: api-urls.md.** Annotate the bulk lines in the existing style,
      e.g.
      ``- [x] `/api/2.0/monitors/<entry_type>/summaries/daily/` (`?type=`)``,
      and the pesticides line with `(no place: the valley)`.
- [ ] **Step 3: Format and check.** Run
      `deno fmt && deno lint && deno check **/*.ts`. Then grep the CHANGELOG for
      `beta.16` and `monitor_types`, to confirm `deno fmt` didn't break the new
      lines.
- [ ] **Step 4: Full verification:**
      `deno test --allow-net --allow-env --env-file --ignore=lib/account/mod_test.ts`
      against the stack running #350. Expect everything to pass or warn about
      empty data.
- [ ] **Step 5: Commit** `docs: changelog and api-urls for beta.16`.
