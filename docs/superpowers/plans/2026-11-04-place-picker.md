# Place picker support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** The SDK matches sjvair.com #307 (`label_plural`) and #308 (place
search rows without geometry, `monitors/?region=`).

**Architecture:** Schema changes in `lib/regions/schemas/`, one new row schema
built from `regionListItemSchema`, and one new option on `getMonitorsList`. Each
task is tested with fixtures or stubbed fetch, so no server is needed.

**Tech Stack:** Deno 2, Zod, `@std/assert`, `stubFetch` / `jsonResponse` from
`lib/http/fetch_stub_test_utils.ts`.

**Spec:** `docs/superpowers/specs/2026-11-04-place-picker-design.md`

## Global Constraints

- Worktree `.worktrees/place-picker`, branch `feature/place-picker`, stacked on
  `feature/remove-levels` (#45).
- New server fields are required in schemas ("No fallbacks"). `county` is
  required and nullable.
- Every schema has an explicit interface (JSR slow types); types use `zinfer`.
- One CHANGELOG line per change, under `## 5.0.0`. The betas line keeps "Not in
  a beta yet", extended with these changes.
- No AI attribution in commits. Never run lib/account tests.
- Worktree test runs need `--allow-read --env-file=../../.env`.
- Each task ends with `deno check mod.ts`, `deno lint`, `deno fmt --check`
  clean.

## Review Focus

1. `region: ["", "abc"]` sends only `region=abc`; `region: ""` and `region: []`
   send none (Task 3 test).
2. `region` never leaks into the fetch init, as `dataset` doesn't (Task 3 test).
3. An empty list with `region` resolves to `[]`, with or without `dataset`;
   without `region` or `dataset` it still rejects (Task 3 test).
4. A search row with `county: null` and `retired` set validates; a row missing
   `county` fails (Task 2 test).
5. `regionPlaceMatchSchema` has no `also_in` and its boundary has no `geometry`
   (Task 2 test on `.shape`, since Zod strips unknown keys).

---

### Task 1: `label_plural` on region types

**Files:**

- Modify: `lib/regions/schemas/regions_meta.ts` (interface and schema, after
  `label`)
- Modify: `lib/regions/fixtures/regions_meta.json` (all 16 `types`)
- Test: `lib/regions/regions_hierarchy_test.ts`
- Modify: `CHANGELOG.md` (Added)

**Interfaces:** Produces `RegionTypeMeta.label_plural: string`.

- [ ] **Step 1: Write the failing test** in `regions_hierarchy_test.ts`:

```ts
Deno.test("regions meta types carry a plural label", () => {
  assertEquals(metaData.types.county.label_plural, "Counties");
  assertEquals(metaData.types.zipcode.label_plural, "ZIP Codes");
  assertEquals(metaData.types.ab617.label_plural, "AB 617 Communities");
  for (const meta of Object.values(metaData.types)) {
    assert(meta.label_plural, `${meta.type} has no label_plural`);
  }
  const { label_plural: _, ...withoutPlural } = metaData.types.county;
  assertEquals(regionTypeMetaSchema.safeParse(withoutPlural).success, false);
});
```

- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --allow-read
      --env-file=../../.env lib/regions/regions_hierarchy_test.ts`.
      Expected: FAIL (type error on `label_plural`, or values undefined).
- [ ] **Step 3: Implement.** Add `label_plural: z.ZodString` / `z.string()` with
      JSDoc "The type's plural label, in Title Case (e.g. "Counties")". Add the
      spec's 16 values to the fixture, after each `label`.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: CHANGELOG** Added: "`label_plural` on each region type in
      `regions/meta/` (sjvair.com #307)."
- [ ] **Step 6: Commit** `feat(regions): add label_plural to region types`.

### Task 2: `searchRegionPlaces` returns `RegionPlaceMatch`

**Files:**

- Modify: `lib/regions/schemas/region.ts` (new schema after
  `regionListItemSchema`)
- Modify: `lib/regions/types.ts` (`RegionPlaceMatch`)
- Modify: `lib/regions/get_region_places.ts` (return type, JSDoc, module
  example)
- Create: `lib/regions/fixtures/regions_places_search.json`
- Create: `lib/regions/place_search_test.ts`
- Modify: `lib/regions/mod_test.ts` (live step validates with the new schema)
- Modify: `CHANGELOG.md` (Breaking), `DEFERRED.md` (Small follow-ups)

**Interfaces:** Produces `regionPlaceMatchSchema`, `RegionPlaceMatchSchema`,
`RegionPlaceMatch`, and
`searchRegionPlaces(q: string, type?: RegionType, options?: RequestOptions): Promise<Array<RegionPlaceMatch>>`.

- [ ] **Step 1: Fixture.** `{ "data": [...] }` with two rows in #308's shape:
      Fresno County (`county: null`, `retired: null`) and the City of Fresno
      (`county: { "type": "county", "external_id": "06019", "name": "Fresno" }`).
      Boundaries are `{ id, version, bbox }`, as in
      `fixtures/regions_overlaps.json`.
- [ ] **Step 2: Write the failing tests** in `place_search_test.ts`:
  - "search rows match the place match schema": validate the fixture with
    `getSimpleValidationTest(regionPlaceMatchSchema)`.
  - "searchRegionPlaces calls regions/places/search and returns rows": stub with
    the fixture; assert pathname `/api/2.0/regions/places/search/`, `q` and
    `type` params, two rows, `rows[1].county?.external_id === "06019"`.
  - "a retired row without a county validates; a row without county fails".
  - "the place match schema has no also_in or geometry":
    `"also_in" in regionPlaceMatchSchema.shape === false` and
    `"geometry" in boundaryListSchema.shape === false`, and the boundary field
    is nullable `boundaryListSchema`.
- [ ] **Step 3: Run**
      `deno test --allow-net --allow-env --allow-read
      --env-file=../../.env lib/regions/place_search_test.ts`.
      Expected: FAIL (`regionPlaceMatchSchema` not exported).
- [ ] **Step 4: Implement.**
      `regionPlaceMatchSchema =
      regionListItemSchema.omit({ also_in: true }).extend({ county:
      regionOverlapSchema.nullable() })`,
      with an explicit interface and JSDoc (`county` is null on county rows and
      outside every county). Export it from `schemas/mod.ts` if the others are;
      add `RegionPlaceMatch` to `types.ts`. Change the return type; update the
      module example comment to "Prints an array of RegionPlaceMatch objects (no
      geometry; use getRegionDetails) ordered by similarity" and the JSDoc
      `@returns`.
- [ ] **Step 5: Run** the Step 3 command. Expected: PASS.
- [ ] **Step 6: Live step.** In `mod_test.ts` "GET regions/places/search/",
      validate with a
      `skippable(getSimpleValidationTest(regionPlaceMatchSchema))` instead of
      `validateRegion`. It fails against a server without #308; that is
      expected.
- [ ] **Step 7: Docs.** CHANGELOG Breaking: "`searchRegionPlaces` returns
      `RegionPlaceMatch[]`: rows have no boundary geometry (only `bbox`) and
      carry a containing `county` (sjvair.com #308)." DEFERRED.md Small
      follow-ups: "Every county on multi-county place search rows", deferred
      2026-11-04 by the user (sjvair.com #308 keeps one `county`); the SDK adds
      `counties` when the server does. **Revisit when** the server adds it
      (data-dashboard DEFERRED.md, same title).
- [ ] **Step 8: Commit**
      `feat(regions)!: place search rows drop geometry and
      add county`.

### Task 3: `getMonitorsList` region filter

**Files:**

- Modify: `lib/monitors/get_monitors_list.ts`
- Test: `lib/monitors/mod_test.ts` (next to the other `getMonitorsList` tests)
- Modify: `api-urls.md`, `CHANGELOG.md` (Added)

**Interfaces:** Produces
`getMonitorsList(options?: RequestOptions & { dataset?: string; region?: string | string[] })`.

- [ ] **Step 1: Write the failing tests** (top-level names start with
      `getMonitorsList`, stubbed with `jsonResponse({ data: [] })`):
  - "getMonitorsList sends one region": `getAll("region")` is `["abc"]`.
  - "getMonitorsList repeats region for several ids": `["abc", "def"]`.
  - "getMonitorsList sends region with dataset": both present.
  - "getMonitorsList drops empty region values": `region: ["", "abc"]` sends
    `["abc"]`; `region: ""` and `region: []` send none (and then reject, since
    the default list is empty).
  - "getMonitorsList keeps region out of fetch init":
    `"region" in stub.calls[0].init === false`.
  - "getMonitorsList with region resolves an empty list": resolves to `[]`.
- [ ] **Step 2: Run**
      `deno test --allow-net --allow-env --allow-read
      --env-file=../../.env lib/monitors/mod_test.ts --filter getMonitorsList`.
      Expected: FAIL (type error on `region`).
- [ ] **Step 3: Implement.** Normalize `region` to a list of non-empty ids; send
      it as `searchParams.region` (array) when non-empty. Reject an empty list
      only when neither `dataset` nor `region` is sent. JSDoc: region ids
      (sqids), several give the union, an unknown id rejects with a 404.
- [ ] **Step 4: Run** the Step 2 command. Expected: PASS, including the four
      existing `getMonitorsList` tests.
- [ ] **Step 5: Docs.** `api-urls.md`:
      ``/api/2.0/monitors/` (`?dataset=`,
      `?region=`)``. CHANGELOG Added:
      "`getMonitorsList({ region })`: monitors in one or more regions
      (sjvair.com #308)." Extend the betas line's "Not in a beta yet" with these
      three changes.
- [ ] **Step 6: Commit** `feat(monitors): filter getMonitorsList by region`.

### Finish

- `deno check mod.ts`, `deno lint`, `deno fmt --check`, and
  `deno test --allow-net --allow-env --allow-read --env-file=../../.env
  lib/regions/regions_hierarchy_test.ts lib/regions/place_search_test.ts
  lib/request_options_forwarding_test.ts`
  plus the `getMonitorsList` filter run.
- Live check: #307 and #308 are merged into sjvair.com `develop` (95daa0bc),
  which the shared stack at :8000 serves. Run `lib/regions` and `lib/monitors`
  against it (GETs only; rule out missing local data before calling a failure a
  bug).
- Push, open the PR (base `feature/remove-levels` until #45 merges, then
  `release/5.0.0`), tell the coordinator, update data-dashboard TODO.md.
