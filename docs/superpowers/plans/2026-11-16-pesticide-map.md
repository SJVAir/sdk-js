# Pesticide Map API Wrappers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap sjvair.com's new pesticide Map endpoints in `@sjvair/sdk`:
notices by day (`5.0.0-beta.12`), then section and township use
(`5.0.0-beta.13`).

**Architecture:** Each endpoint gets a Zod schema under
`lib/pesticides/schemas/`, plus a function file in `lib/pesticides/` that calls
`apiCall` (the map endpoints answer with a bare FeatureCollection, with no
`{data}` envelope). One shared helper builds the map endpoints' search params.
The meta additions extend `pesticidesMetaSchema`. "Known values plus any string"
schemas come from one helper in `lib/schema.ts`.

**Tech Stack:** Deno 2, TypeScript, Zod 4, `@std/assert`, and the SDK's `$http`
layer (`apiCall`, `RequestOptions`).

**Spec:** `docs/superpowers/specs/2026-11-16-pesticide-map-design.md`. The
server spec (the source of truth for shapes) is sjvair.com
`docs/superpowers/specs/2026-11-16-pesticide-map-api-design.md` on
`origin/feature/pesticide-notices-day`. Read it with `git -C ../sjvair.com show`
and never check that branch out in the shared checkout.

## Global Constraints

- Branches: PR 1 (Tasks 1-5) is on `feature/pesticide-map-notices`, from
  `release/5.0.0`. PR 2 (Tasks 6-10) is on `feature/pesticide-map-use`, from
  `release/5.0.0` after PR 1 merges (or stacked on PR 1).
- Types come from Zod schemas via `zinfer`, and every exported schema has an
  explicit type annotation (JSR slow-types rule; `deno publish --dry-run` must
  stay clean).
- No fallbacks: a field is optional only where the current server omits it
  (`past` without `date`, `classes` without `classes=1`, the `*_prev` properties
  without `compare`). `year` on sections, townships and section details is
  `number | "all" | null`.
- Filter params are exactly the spec's tables. Entity filters are the id forms
  only: `chemical_id`, `product_id`, `commodity_id` (sections and townships
  only) and `aerial_ground`. No CDPR-code `chemical`, `product`, `commodity` or
  `method`.
- Each new module file has a JSDoc block with `@example Usage` and `@module`.
  Add each new function file to `deno.json` `exports` (`"./pesticides/<file>"`),
  like its neighbours, and re-export it from `lib/pesticides/mod.ts`.
- Test files are named `*_test.ts`. Use `getSimpleValidationTest` from
  `$testing` and `stubFetch`/`jsonResponse` from
  `lib/http/fetch_stub_test_utils.ts`.
- Test command (from the repo root; in a worktree use `--env-file=../../.env`):
  `deno test --allow-net --allow-env --env-file lib/pesticides lib/regions`.
  **Never** run the bare full suite (the account test sends SMS), and never use
  `TEST_REMOTE=1`.
- Before each PR: `deno fmt --check`, `deno lint`, `deno check lib/**/*.ts`,
  `deno publish --dry-run --allow-dirty`, and the test command above. After
  `deno fmt`, recheck markdown code spans and the CHANGELOG anchors.
- No Claude or AI attribution in commits, PRs, docs or the CHANGELOG. No to-do
  lists for other projects.
- Merges, tags and publishes each need the user's explicit yes. A PR merges only
  after its server PR is in sjvair.com `develop` and the integration tests pass
  on the local stack. Ask the coordinator (`data-dashboard-59`, via ListAgents)
  when that code is live, and don't swap the web container.

## Review Focus

1. **A 400 from the server** (bad `date`, unknown category, more than 2000
   notices): the caller gets the server's message at
   `error.cause.result.body.error`. Task 3 pins it.
2. **An unknown location `source`/`type` or badge key**: it parses and comes
   back unchanged, and known values still autocomplete. Tasks 1 and 2 pin it.
3. **`category` as a single string versus an array**: a string is sent as one
   `category=` and an array as repeated params, never joined with commas. Task 3
   pins it for the shared helper.
4. **`geometry: false`**: the server sends `geometry: null` on every feature,
   and the schema must accept it. Task 6 pins it.
5. **A township or section with all-zero totals**, or `classes` with
   `breaks: []` and `min: null` (no positive values): it parses. Tasks 6 and 7
   pin it.

---

## PR 1 / beta.12 (server PR 1)

### Task 1: Open-ended location `source` and `type`

**Files:**

- Modify: `lib/schema.ts` (add `openEnum`)
- Modify: `lib/regions/schemas/location.ts:4-24`
- Test: `lib/regions/schemas/location_test.ts` (create)
- Modify: `CHANGELOG.md` (5.0.0 `### Breaking`)

**Interfaces:**

- Produces:
  `openEnum<const T extends readonly [string, ...string[]]>(values: T): OpenEnumSchema<T>`
  in `lib/schema.ts`, where `OpenEnumSchema<T>` is an exported schema type whose
  inferred output is `T[number] | (string & {})`. The schema accepts any string
  and rejects non-strings. Suggested shape:
  `z.union([z.enum(values), z.string() as z.ZodType<string & {}>])`. The
  implementer picks the mechanics, provided `deno check` and
  `deno publish --dry-run` pass.
- Produces:
  `locationSourceSchema = openEnum(["cde-public", "cde-private",
  "cdss-ccl"])`
  and
  `locationTypeSchema = openEnum(["public_school",
  "private_school", "child_care"])`.
  Their exported type aliases (`LocationSourceSchema`, `LocationTypeSchema`)
  become `OpenEnumSchema<...>`. `LocationSource` and `LocationType` in
  `lib/regions/types.ts` follow automatically.

- [ ] **Step 1: Write the failing tests** in `location_test.ts`:
  - `"an unknown location source parses unchanged"`:
    `assertEquals(locationSourceSchema.parse("cde-charter"), "cde-charter")`.
  - `"an unknown location type parses unchanged"`:
    `locationTypeSchema.parse("preschool") === "preschool"`.
  - `"known values still parse"`: each of the three known values of each schema
    parses unchanged.
  - `"a non-string source is rejected"`:
    `locationSourceSchema.safeParse(3).success === false`.
  - `"location_types may omit a known type"`: `regionsMetaSchema` (from
    `lib/regions/schemas/regions_meta.ts`) parses a fixture meta whose
    `location_types` lacks `child_care`, and one that adds `preschool`. Build it
    from the existing regions meta fixture if there is one, otherwise a minimal
    object.
  - A type-level check:
    `const s: LocationSource = "cde-public"; const t: LocationSource = "anything";`
    compiles.
- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --env-file lib/regions/schemas/location_test.ts`.
      Expected: the unknown-value tests FAIL.
- [ ] **Step 3: Implement `openEnum`** in `lib/schema.ts`, and switch the two
      schemas in `location.ts` to it. The existing "a location without a source
      fails the schema" test in `get_pesticide_locations_test.ts` must still
      pass: a missing field is still an error.
- [ ] **Step 4: Run** the test command over `lib/regions lib/pesticides`.
      Expected: PASS. Also run `deno check lib/**/*.ts`. If the
      `z.record(locationTypeSchema, …)` in regions meta no longer type-checks or
      no longer parses, stop and tell the user (spec: "If keeping the known keys
      required turns out to matter, tell the user").
- [ ] **Step 5: CHANGELOG.** Under `### Breaking`, add: "`LocationSource` and
      `LocationType` (and their schemas) accept any string as well as the known
      values, so a new server value no longer fails `/regions/locations/` or
      `/pesticides/locations/`. Code that assigns them to the old closed union
      stops compiling."
- [ ] **Step 6: Commit**
      `regions: accept unknown location source and type values`.

### Task 2: Meta `notes`, `badges`, `links`, `notice_filters`

**Files:**

- Create: `lib/pesticides/schemas/badge.ts`
- Modify: `lib/pesticides/schemas/pesticides_meta.ts`, `schemas/mod.ts`,
  `lib/pesticides/types.ts`
- Modify: `lib/pesticides/fixtures/pesticides_meta.json` (hand-built additions
  for now; Task 5 replaces them with a captured response)
- Modify: `lib/pesticides/get_pesticides_meta.ts` (JSDoc), and
  `lib/pesticides/mod_test.ts` ("Module: pesticides meta")

**Interfaces:**

- Consumes: `openEnum` (Task 1).
- Produces:
  `pesticideBadgeKeySchema = openEnum(["prop65", "carb_tac",
  "iarc_1", "iarc_2a", "iarc_2b", "iarc_3", "california_restricted"])`
  and `type PesticideBadgeKey`. Task 9 uses them.
- Produces, on `PesticidesMeta`:
  - `notes: Record<string, PesticideNote>`, where
    `PesticideNote = { key:
    string; title: string; summary: string; detail: string | null;
    source_url: string }`.
  - `badges: Array<{ key: PesticideBadgeKey; label: string; note: string }>`.
  - `links: { spraydays_signup: string }`.
  - `notice_filters: Array<string>`.

  All four are required. Export the types `PesticideNote` and `PesticideBadge`.

- [ ] **Step 1: Extend the fixture** from the server spec:
  - `notes` holds at least the ten guaranteed keys, each with `key` equal to its
    record key. Give one a `detail: null` and the rest strings.
  - `badges` holds the seven rows in the spec's order, with these labels: "Prop
    65", "CARB TAC", "IARC 1", "IARC 2A", "IARC 2B", "IARC 3", "Restricted".
  - `links` is `{ "spraydays_signup": "https://spraydays.cdpr.ca.gov/" }`.
  - `notice_filters` is
    `["chemical_id", "product_id", "category",
    "iarc_group", "narrow", "aerial_ground"]`.
- [ ] **Step 2: Write the failing test steps** in "Module: pesticides meta":
  - `"badges are in display order and resolve to notes"`: the badge keys equal
    the seven keys in order, and every `badge.note` is a key of `meta.notes`.
  - `"notes carry their key"`: `meta.notes[k].key === k` for every `k`.
  - `"meta without links is rejected"`: `safeParse` with `links` removed is
    `false`. Do the same for `notes`, `badges` and `notice_filters`.
  - `"an unknown badge key and note parse"`: adding a badge
    `{ key: "new_list", label: "New", note: "new_list" }` and a note `new_list`
    parses.
- [ ] **Step 3: Run**
      `deno test --allow-net --allow-env --env-file lib/pesticides/mod_test.ts`.
      Expected: the new steps FAIL. The integration step `GET pesticides/meta/`
      also fails, or skips, until the server has PR 1. That is expected.
- [ ] **Step 4: Implement** the schemas. Name the guaranteed note keys in the
      `notes` JSDoc, and update `getPesticidesMeta`'s JSDoc, which says "The
      five lists".
- [ ] **Step 5: Run** the test command. Expected: PASS, except the live meta
      step if the local server hasn't got PR 1 yet. Note that in the PR
      description, not in the code.
- [ ] **Step 6: Commit**
      `pesticides: meta notes, badges, links and notice_filters`.

### Task 3: `getActivePesticideNotices`

**Files:**

- Create: `lib/pesticides/map_params.ts` (shared with PR 2)
- Create: `lib/pesticides/schemas/active_pesticide_notice.ts`
- Create: `lib/pesticides/get_active_pesticide_notices.ts`
- Create: `lib/pesticides/fixtures/active_pesticide_notices.json` (hand-built
  from the server code and spec; Task 5 replaces it)
- Test: `lib/pesticides/get_active_pesticide_notices_test.ts`
- Modify: `schemas/mod.ts`, `types.ts`, `mod.ts`, `deno.json` `exports`

**Interfaces:**

- Produces:
  `mapSearchParams(params: Record<string, unknown>): Record<string, string | Array<string>>`
  in `map_params.ts`. It turns
  - `bbox` (a 4-tuple) into `"w,s,e,n"`,
  - arrays into repeated params,
  - `classes: true` into `"1"`,
  - `geometry: false` into `"0"`,
  - numbers into strings.

  It skips `undefined`, `signal` and `init`. Tasks 6 and 7 use it.
- Produces the schemas `activePesticideNoticePropertiesSchema`,
  `activePesticideNoticeFeatureSchema` and
  `activePesticideNoticeCollectionSchema`
  (`{ type: "FeatureCollection";
  as_of: string; features }`). The properties
  are as in the spec's response block. `past` is `z.optional(z.boolean())`,
  chemicals are `{ id, name,
  display_name, is_of_concern }` and products are
  `{ id, name }`. Types: `ActivePesticideNoticeProperties`,
  `ActivePesticideNoticeFeature` and `ActivePesticideNoticeCollection`.
- Produces
  `type ActivePesticideNoticesParams = { bbox?: [west: number,
  south: number, east: number, north: number]; region?: string; buffer?: 0 |
  1 | 3 | 5; date?: string; chemical_id?: string; product_id?: string;
  county?: string; narrow?: PesticideNarrow; aerial_ground?:
  AerialGroundFilter; category?: string | ReadonlyArray<string>; iarc_group?:
  IARCGroup } & RequestOptions`.
- Produces `getActivePesticideNotices`, with overloads:
  - `(params: ActivePesticideNoticesParams & { date: string }): Promise<ActivePesticideNoticeCollection & { features: Array<ActivePesticideNoticeFeature & { properties: { past: boolean } }> }>`
  - `(params?: ActivePesticideNoticesParams): Promise<ActivePesticideNoticeCollection>`

  Export a named type for the dated result (`DatedPesticideNoticeCollection`)
  rather than repeating the intersection.

- [ ] **Step 1: Build the fixture.** It needs three features, all with `past`:
      one ordinary, one with `geometry: null`, `county`, `section` and
      `section_id` null and `treated_amount` null, and one with
      `application_method: ""` and `past: true`. Use `as_of` and ISO timestamps
      with offsets.
- [ ] **Step 2: Write the failing tests:**
  - `"notices fixture matches the schema"`: validate each feature.
  - `"a feature without past parses"`: drop `past` and parse.
  - `"a feature without scheduled_end fails"`.
  - `"getActivePesticideNotices calls notices/active/"`: the stub's URL path
    ends with `/api/2.0/pesticides/notices/active/`, and the result is the bare
    collection.
  - `"sends every param as the server spells it"`: a call with all params set
    yields `bbox=-119.9,36.7,-119.7,36.85`, `region=abc12`, `buffer=3`,
    `date=2026-11-14`, `chemical_id=gs65e`, `product_id=p1x2y`, `county=fresno`,
    `narrow=concern`, `aerial_ground=A`, and `iarc_group=2A`. It sends no
    `chemical`, `product`, `commodity` or `method` keys.
  - `"a category array is sent as repeated params"`:
    `searchParams.getAll("category")` deep-equals
    `["fumigant",
    "california_restricted"]`. A single string gives one
    value.
  - `"unset params are not sent"`: `getActivePesticideNotices()` produces an
    empty query string.
  - `"a 400 carries the server's message"`: the stub responds with status 400
    and body `{"error": "date must be YYYY-MM-DD"}`. The call rejects, and
    `error.cause.result.body.error === "date must be YYYY-MM-DD"`.
  - `"the signal is passed through"`: an aborted controller rejects with its
    reason.
  - Type-level (checked by `deno check`): with `date`,
    `result.features[0].properties.past` is `boolean` (assign it to a `boolean`
    variable). Without `date`, assigning it to `boolean` is a
    `// @ts-expect-error`.
- [ ] **Step 3: Run**
      `deno test --allow-net --allow-env --env-file lib/pesticides/get_active_pesticide_notices_test.ts`.
      Expected: FAIL (the module is missing).
- [ ] **Step 4: Implement** `map_params.ts`, the schema and the function. Fetch
      with
      `apiCall<ActivePesticideNoticeCollection>({ url:
  "pesticides/notices/active", searchParams: mapSearchParams(params),
  options: { signal, init } })`,
      following `getPesticideLocations`. The JSDoc covers:
  - the Pacific `date` and its 4-day window,
  - that `chemical_id`/`product_id` take ids from `searchPesticides`,
  - the 2000-match 400,
  - that `chemical_id`, `category` and `iarc_group` must hold on one chemical,
  - where the 400 message lives.
- [ ] **Step 5: Run** the test command. Expected: PASS.
- [ ] **Step 6: Commit**
      `pesticides: getActivePesticideNotices (notices/active/)`.

### Task 4: Docs and release notes for PR 1

**Files:** `api-urls.md`, `CHANGELOG.md`, `lib/pesticides/mod.ts` (module JSDoc,
if it lists the functions)

- [ ] **Step 1: Update `api-urls.md`.** Check
      `/api/2.0/pesticides/notices/active/`. Change `notices/archive/`'s note to
      "<- Not wrapped: deferred 2026-11-16, no caller yet". Leave the sections
      and townships lines as they are.
- [ ] **Step 2: Update `CHANGELOG.md`.** Under `### Added`, add
      `getActivePesticideNotices` and the meta `notes`, `badges`, `links` and
      `notice_filters`. In the betas paragraph, add "**5.0.0-beta.12**
      (unreleased): …", stating that it needs sjvair.com `develop` with server
      PR 1. Grep after `deno fmt` to check the anchor survived.
- [ ] **Step 3: Run** the full pre-PR checks from Global Constraints. Expected:
      all clean.
- [ ] **Step 4: Commit** `docs: api-urls and changelog for the notices group`,
      push with `git push -u origin feature/pesticide-map-notices`, and open the
      PR into `release/5.0.0`. The description:
  - says it needs sjvair.com server PR 1 (notices) merged into `develop`, and
    that the beta must not be published before then;
  - lists the breaking location type change;
  - gives the verification commands that were run.

  Send the PR link to the coordinator.

### Task 5: Capture real responses and run the integration tests (gated)

Starts only after the coordinator says server PR 1 is merged and live on the
local stack.

- [ ] **Step 1: Capture the responses.** Fetch
      `http://127.0.0.1:8000/api/2.0/pesticides/notices/active/?date=<a recent day
  with notices>&bbox=<a Fresno-area box>`
      and `…/pesticides/meta/`. Trim the notices to about three features,
      keeping one with a null field if one exists. Replace the hand-built
      fixtures, keeping the meta fixture's `{data}` wrapper.
- [ ] **Step 2: Add integration steps** that skip with `isUnavailable`, as the
      meta step does:
  - `getActivePesticideNotices({ date: <today in Pacific> })` validates every
    feature, and each has a boolean `past`.
  - `getActivePesticideNotices({ date: "2026-13-01" })` rejects with a 400 and a
    string `body.error`.
  - The live meta step validates.
- [ ] **Step 3: Run** the test command. Expected: PASS. If the real responses
      contradict the schema, stop and tell the user. Don't loosen the schema to
      make the tests pass.
- [ ] **Step 4: Commit** `pesticides: captured notices and meta fixtures` and
      push. Then ask the user for the merge, and separately for the beta.12
      publish (`chore: Release 5.0.0-beta.12`, bump `deno.json`, tag). Each
      needs its own explicit yes.

## PR 2 / beta.13 (server PR 2)

Before Task 6, ask the coordinator for server PR 2's final shapes, and diff them
against the spec. If anything differs, update the spec and this plan and tell
the user first.

### Task 6: `getPesticideSections`

**Files:**

- Create: `lib/pesticides/schemas/pesticide_map_use.ts` (shared by sections and
  townships)
- Create: `lib/pesticides/get_pesticide_sections.ts`,
  `fixtures/pesticide_sections.json`, `get_pesticide_sections_test.ts`
- Modify: `lib/regions/schemas/region_geojson.ts` (export the
  Polygon/MultiPolygon union under a general name, or reuse
  `regionGeometrySchema`), `schemas/mod.ts`, `types.ts`, `mod.ts`, `deno.json`

**Interfaces:**

- Consumes: `mapSearchParams` (Task 3).
- Produces:
  - `pesticideUseTotalsSchema`:
    `{ lbs_chemical, lbs_product, acres_treated,
    applications }` (numbers),
    plus an optional `*_prev` for each.
  - `pesticideUseClassSchema`: `{ breaks: number[]; min: number | null }`.
  - `pesticideUseClassesSchema`:
    `{ lbs_chemical, acres_treated,
    applications }`, each a class.
  - `pesticideSectionCollectionSchema`:
    `{ type: "FeatureCollection"; year:
    number | "all" | null; classes?: PesticideUseClasses; features }`.
    Each feature is
    `{ type: "Feature"; id: string; geometry: Polygon |
    MultiPolygon | null; properties: { id: string; mtrs: string; county:
    string | null } & totals }`.
  - The types `PesticideUseClasses`, `PesticideSectionFeature` and
    `PesticideSectionCollection`.
- Produces
  `type PesticideUseFilters = { year?: number | "all"; month?: number;
  compare?: number; chemical_id?: string; product_id?: string;
  commodity_id?: string; county?: string; aerial_ground?: AerialGroundFilter;
  narrow?: PesticideNarrow; category?: string | ReadonlyArray<string>;
  iarc_group?: IARCGroup; classes?: true; geometry?: false }`.
- Produces
  `type PesticideSectionsArea = ({ bbox } | { lat: number; lng:
  number; radius?: 1 | 3 | 5 }) & { region?: string; buffer?: 0 | 1 | 3 | 5 }
  | { region: string; buffer?: 0 | 1 | 3 | 5 }`.
- Produces `getPesticideSections`, with overloads:
  - `params & { classes: true }` resolves to
    `PesticideSectionCollection & { classes: PesticideUseClasses }`.
  - Otherwise it resolves to `PesticideSectionCollection`.

  The params are
  `PesticideSectionsArea & PesticideUseFilters &
  RequestOptions`.

- [ ] **Step 1: Build the fixture.** It needs two Polygon features (one all
      zeros), with `classes` holding one populated class and one
      `{ breaks: [],
  min: null }`. Add a second fixture variant, built in the
      test, with `geometry: null` on every feature and `year: null`.
- [ ] **Step 2: Write the failing tests:**
  - The fixture validates.
  - The `geometry: null` and `year: null` variant validates.
  - A feature with `lbs_chemical_prev` but no `compare` param still parses (the
    schema is per-field optional).
  - The path is `/api/2.0/pesticides/sections/`.
  - `{ bbox, year: 2023, month: 6, classes: true, geometry: false }` sends
    `year=2023`, `month=6`, `classes=1` and `geometry=0`.
  - `{ lat: 36.7, lng: -119.8, radius: 3 }` sends `lat`, `lng` and `radius`, and
    no `bbox`.
  - `{ region: "abc12", buffer: 1 }` alone is accepted.
  - `year: "all"` sends `year=all`.
  - Type-level: `{}` with no area is a `@ts-expect-error`. With `classes: true`,
    `result.classes.lbs_chemical.breaks` type-checks without `?.`.
  - A 400 (`"bbox too large; zoom in"`) surfaces at `body.error`.
- [ ] **Step 3: Run** the new test file. Expected: FAIL.
- [ ] **Step 4: Implement.** The JSDoc covers:
  - the 2500-section cap;
  - that the classes rank the whole valley for the value filters and never use
    the area;
  - that each month is ranked alone;
  - that `breaks[i]` is class i's inclusive upper bound and zero means no data
    (draw it with `meta.ramp.no_data`);
  - that `geometry: false` gives `null` geometry.
- [ ] **Step 5: Run** the test command. Expected: PASS.
- [ ] **Step 6: Commit** `pesticides: getPesticideSections (sections/)`.

### Task 7: `getPesticideTownships`

**Files:** `lib/pesticides/get_pesticide_townships.ts`,
`fixtures/pesticide_townships.json`, `get_pesticide_townships_test.ts`; add the
township schemas to `schemas/pesticide_map_use.ts`; update `types.ts`, `mod.ts`
and `deno.json`.

**Interfaces:**

- Consumes: `pesticideUseTotalsSchema`, `pesticideUseClassesSchema`,
  `PesticideUseFilters` and `mapSearchParams`.
- Produces `pesticideTownshipCollectionSchema`, which is
  `pesticideSectionCollectionSchema` with properties
  `{ id: string; name:
  string; sections: number } & totals`. Types:
  `PesticideTownshipFeature` and `PesticideTownshipCollection`.
- Produces
  `getPesticideTownships(params?: ({ bbox?: [w, s, e, n] } & {
  region?: string; buffer?: 0 | 1 | 3 | 5 }) & PesticideUseFilters &
  RequestOptions)`,
  with the same `classes` overload as Task 6. There is no `lat`/`lng` form.

- [ ] **Step 1: Write the failing tests:**
  - The fixture validates, with a feature id like `MDM-T14S-R20E`.
  - The path is `/api/2.0/pesticides/townships/`.
  - `getPesticideTownships()` sends an empty query string.
  - `{ bbox, region: "abc12" }` sends both.
  - Type-level: passing `lat` is a `@ts-expect-error`.
  - The `classes` overload works, as in Task 6.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement.** The JSDoc says the township `id` is the permanent
      PLSS designation, and that it changes only if the MTRS sections are
      reimported under different names.
- [ ] **Step 4: Run** the test command. Expected: PASS.
- [ ] **Step 5: Commit** `pesticides: getPesticideTownships (townships/)`.

### Task 8: Meta `years` and `ramp`

**Files:** `schemas/pesticides_meta.ts`, `fixtures/pesticides_meta.json`,
`mod_test.ts`, `get_pesticides_meta.ts` (JSDoc)

- [ ] **Step 1: Write the failing tests.** Add `years` (for example
      `[2023, 2022, 2021]`) and `ramp` (eight hex colours, `no_data: "#f0f0f0"`)
      to the fixture, plus `notes.shades_valley`. Test steps:
  - `"years are newest first"`.
  - `"ramp has colors and no_data"`.
  - `"meta without years is rejected"`, and the same for `ramp`.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement** `years: number[]` and
      `ramp: { colors: string[];
  no_data: string }`, both required. Add
      `shades_valley` to the guaranteed notes in the JSDoc.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `pesticides: meta years and ramp`.

### Task 9: `getPesticideSectionDetails`

**Files:** `schemas/pesticide_section_detail.ts`,
`get_pesticide_section_details.ts`, `fixtures/pesticide_section_detail.json`,
`get_pesticide_section_details_test.ts`; update `schemas/mod.ts`, `types.ts`,
`mod.ts` and `deno.json`.

**Interfaces:**

- Consumes: `pesticideBadgeKeySchema` (Task 2).
- Produces `pesticideSectionDetailSchema`:
  `{ id: string; mtrs: string;
  county: string | null; year: number | "all" | null; geometry: Polygon |
  MultiPolygon | null; years: Array<{ year: number; lbs_chemical: number;
  lbs_product: number; acres_treated: number; applications: number }>;
  months: Array<{ month: number; lbs_chemical: number; acres_treated: number;
  applications: number }>; top_chemicals: Array<{ id: string; name: string;
  display_name: string; lbs: number; is_of_concern: boolean; badges:
  Array<PesticideBadgeKey> }>; top_products: Array<{ id; name; display_name;
  lbs }>; top_commodities: Array<{ id; name; display_name; lbs }> }`.
  Check each field against `SectionDetailBase.get` and the captured response.
  The type is `PesticideSectionDetail`.
- Produces
  `getPesticideSectionDetails(id: string, filters?: { year?: number |
  "all"; narrow?: PesticideNarrow }, options?: RequestOptions):
  Promise<PesticideSectionDetail>`,
  fetched with `apiCall` (a bare object).

- [ ] **Step 1: Write the failing tests:**
  - The fixture validates. It has 12 month rows and one top chemical with
    `badges: ["prop65", "iarc_2b"]`.
  - A chemical row without `badges` fails.
  - The path is `/api/2.0/pesticides/sections/abc12/`.
  - `{ year: "all", narrow: "concern" }` sends both.
  - A 404 rejects, and `isUnavailable` is not used in this test.
- [ ] **Step 2: Run** the test file. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the test command. Expected: PASS.
- [ ] **Step 5: Commit**
      `pesticides: getPesticideSectionDetails (sections/<id>/)`.

### Task 10: PR 2 docs, captured fixtures and integration (gated)

- [ ] **Step 1: Update `api-urls.md` and `CHANGELOG.md`.** Check `sections/`,
      `sections/<id>/` and `townships/` in `api-urls.md`. In `CHANGELOG.md`, add
      the three functions and meta `years`/`ramp` under `### Added`, and add
      "**5.0.0-beta.13** (unreleased)" stating that it needs server PR 2.
- [ ] **Step 2: Open the PR into `release/5.0.0`.** Run the pre-PR checks, push
      `feature/pesticide-map-use`, and open the PR. The description says it
      needs sjvair.com server PR 2. Send the coordinator the link.
- [ ] **Step 3: Capture real responses (gated).** Once the coordinator says
      server PR 2 is live locally, capture real `sections/?bbox=…&classes=1`,
      `townships/?classes=1&geometry=0`, `sections/<id>/` and `meta/` responses
      as fixtures (trimmed). Add integration steps that skip with
      `isUnavailable`.
- [ ] **Step 4: Run** the test command. Expected: PASS. If a response
      contradicts the schema, stop and tell the user.
- [ ] **Step 5: Finish.** Commit, push, and ask the user for the merge and,
      separately, for the beta.13 publish.
