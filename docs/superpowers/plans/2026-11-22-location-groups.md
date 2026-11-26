# Location groups and valley-wide pesticide locations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Type `regions/meta/`'s new `location_groups` and per-type `group`, and
let `getPesticideLocations` fetch the whole valley with no area (sjvair.com
#351), for 5.0.0-beta.17.

**Architecture:** Two independent changes. The regions meta schema gains two
required fields and the `RegionsMeta` wrapper exposes the groups. The
`PesticideLocationsArea` union gains a no-area member, and every member names
every area key (`?: never` where it doesn't take one) so the function can branch
on `!== undefined`.

**Tech Stack:** Deno 2, TypeScript, Zod 4, `@std/assert`.

**Spec:** `docs/superpowers/specs/2026-11-22-location-groups-design.md`

## Global Constraints

- Work in the worktree `.worktrees/location-groups` on branch
  `feature/location-groups` (from `origin/release/5.0.0`). The PR goes into
  `release/5.0.0`.
- No fallbacks for older servers: new fields are required (no `.optional()` or
  `.default()`).
- Types come from Zod schemas via `zinfer`, never hand-written.
- Commits are GPG-signed, with no `Co-Authored-By`, `Claude-Session` or other AI
  attribution lines. On "No passphrase given", stop and ask the user. Never
  commit unsigned.
- Stubbed tests run with
  `deno test --allow-net --allow-env --env-file=../../.env <file>` from the
  worktree. Live steps hit `http://127.0.0.1:8000` and may need the sandbox
  disabled. Never run `lib/account/mod_test.ts`.
- Live tests validate what comes back and warn on empty. They never require
  counts.
- Run `deno fmt` after every edit, then grep the edited markdown and
  `@ts-expect-error` lines to check they're still where you meant them.

## Review Focus

- A caller passing `{ radius }` or `{ buffer }` with no area: it must not
  compile, because the server answers 400. Pinned by `@ts-expect-error` cases in
  Task 2.
- A caller whose area is a union-typed variable (e.g. from a UI state): it must
  compile and send the right params. Pinned in Task 2.
- A future server group (e.g. `"preschool"`), or a group key the SDK doesn't
  know: it must still parse. Pinned in Task 1.
- `asIter.locationGroups` order: by `order`, not by record key order. Pinned in
  Task 1 with a fixture copy whose keys are reversed.
- `getPesticideLocations()` with no argument at all: it must send no area,
  `type` or `county` params. Pinned in Task 2.

---

### Task 1: Location groups in the regions meta

**Files:**

- Modify: `lib/regions/schemas/location.ts` (add the group key schema beside
  `locationTypeSchema`)
- Modify: `lib/regions/schemas/regions_meta.ts:47-86`
- Modify: `lib/regions/types.ts` (import list and types near :108-111)
- Modify: `lib/regions/get_regions_meta.ts` (asIter, getter, module example)
- Modify: `lib/regions/fixtures/regions_meta.json`
- Test: `lib/regions/regions_hierarchy_test.ts` (stubbed),
  `lib/regions/mod_test.ts` (live step)
- Modify: `CHANGELOG.md`

**Interfaces:**

- Produces:
  - `locationGroupKeySchema: LocationGroupKeySchema`, where
    `LocationGroupKeySchema = OpenEnumSchema<readonly ["school", "child_care"]>`,
    built with `openEnum` like `locationTypeSchema`.
  - `locationGroupSchema`:
    `z.object({ key: locationGroupKeySchema, label: z.string(), order: z.number() })`,
    with a named `interface LocationGroupSchema` like the file's others.
  - `locationTypeMetaSchema` gains `group: locationGroupKeySchema` (required).
  - `regionsMetaSchema` gains
    `location_groups: z.record(z.string(), locationGroupSchema)` (required),
    declared after `location_types`.
  - Types `LocationGroupKey = zinfer<typeof locationGroupKeySchema>` and
    `LocationGroup = zinfer<typeof locationGroupSchema>` in
    `lib/regions/types.ts`.
  - `RegionsMeta.location_groups: Record<string, LocationGroup>` (a getter) and
    `RegionsMeta.asIter.locationGroups: Array<LocationGroup>`, sorted by `order`
    ascending.

- [ ] **Step 1: Update the fixture from the local server**

Fetch `http://127.0.0.1:8000/api/2.0/regions/meta/`. Diff it against
`lib/regions/fixtures/regions_meta.json` with `jq -S` and check the only
differences in the two new fields are the additions. Other drift, such as
counts, stays as it is. Insert as text: `"group"` after `"source"` in each
`location_types` row, and the `location_groups` object after `location_types`.
The values were read 2026-11-22: `school` →
`{"key":"school","label":"Schools","order":0}`, `child_care` →
`{"key":"child_care","label":"Child care","order":1}`;
`public_school`/`private_school` group `"school"`, `child_care` group
`"child_care"`.

- [ ] **Step 2: Write the failing stubbed tests** in
      `lib/regions/regions_hierarchy_test.ts`

```ts
Deno.test("regions meta fixture carries the location groups", () => {
  getSimpleValidationTest(regionsMetaSchema)(metaData);
  assertEquals(metaData.location_types.public_school.group, "school");
  assertEquals(metaData.location_types.private_school.group, "school");
  assertEquals(metaData.location_types.child_care.group, "child_care");
  assertEquals(metaData.location_groups.school, {
    key: "school",
    label: "Schools",
    order: 0,
  });
  assertEquals(metaData.location_groups.child_care.order, 1);
});

Deno.test("a location type without a group fails the schema", () => {
  const { group: _group, ...row } = metaData.location_types.child_care;
  const data = {
    ...metaData,
    location_types: { ...metaData.location_types, child_care: row },
  };
  assertEquals(regionsMetaSchema.safeParse(data).success, false);
});

Deno.test("a newer location group still parses", () => {
  const data = {
    ...metaData,
    location_groups: {
      ...metaData.location_groups,
      preschool: { key: "preschool", label: "Preschools", order: 2 },
    },
  };
  assertEquals(regionsMetaSchema.safeParse(data).success, true);
});

Deno.test("RegionsMeta lists location groups by order", async () => {
  // Keys reversed, so record order disagrees with `order`.
  const { school, child_care } = metaData.location_groups;
  const reversed = {
    ...metaData,
    location_groups: { child_care, school },
  };
  const stub = stubFetch(() => jsonResponse({ data: reversed }));
  try {
    const meta = await getRegionsMeta();
    assertEquals(
      meta.asIter.locationGroups.map((g) => g.key),
      ["school", "child_care"],
    );
    assertEquals(meta.location_groups.child_care.label, "Child care");
  } finally {
    stub.restore();
  }
});
```

- [ ] **Step 3: Run to see them fail**

Run:
`deno test --allow-net --allow-env --env-file=../../.env lib/regions/regions_hierarchy_test.ts`.
Expected: a type-check failure (`group` / `location_groups` don't exist on
`RegionsMetaData`).

- [ ] **Step 4: Implement the schemas, types and wrapper** following the
      Interfaces block

  - The JSDoc on `group` says it is the `location_groups` key this type is
    listed under.
  - The JSDoc on `location_groups` says it holds the groups that location types
    are listed under, by key, and to sort by `order`.
  - `RegionsMeta` sorts with
    `Object.values(...).sort((a, b) => a.order - b.order)`, like `MonitorsMeta`.
  - Add `location_groups` to the module `@example` printout.

- [ ] **Step 5: Add a live step** in `lib/regions/mod_test.ts`, after
      `GET  regions/meta (county type lookup)`

Step name: `GET  regions/meta (location groups)`. It asserts that every
`meta.asIter.locationTypes` row's `group` is a key of `meta.location_groups`,
and that `asIter.locationGroups` is sorted by `order`. It doesn't assert counts
or particular keys.

- [ ] **Step 6: Run the stubbed and live tests**

Run:
`deno test --allow-net --allow-env --env-file=../../.env lib/regions/regions_hierarchy_test.ts lib/regions/mod_test.ts lib/regions/schemas/location_test.ts`
(sandbox off for the live server). Expected: all pass. If a live step fails,
first check whether the cached `regions/meta/` response is stale.

- [ ] **Step 7: CHANGELOG**

Under 5.0.0's `### Added`, at the top, add this entry, then run `deno fmt` and
grep that it landed:

> `regions/meta/` location groups: `location_groups` (`LocationGroup`: `key`,
> `label`, `order`), each location type's `group` (`LocationGroupKey`,
> `"school"` or `"child_care"`, or any newer key), and
> `RegionsMeta.location_groups` and `asIter.locationGroups` (sorted by `order`).
> Needs a server running sjvair.com #351. (from beta.17, #71)

Use the real PR number once the PR is open; #71 is the expected next one.

- [ ] **Step 8: Commit**

```bash
git add lib/regions CHANGELOG.md
git commit -m "feat(regions): location groups in regions meta"
```

### Task 2: Valley-wide `getPesticideLocations`

**Files:**

- Modify: `lib/pesticides/get_pesticide_locations.ts`
- Test: `lib/pesticides/get_pesticide_locations_test.ts` (stubbed),
  `lib/pesticides/mod_test.ts` (live step)
- Modify: `CHANGELOG.md`, `api-urls.md:150`

**Interfaces:**

- Produces: `PesticideLocationsArea` (exported, same name) and
  `getPesticideLocations(params?: PesticideLocationsParams): Promise<PesticideLocationCollection>`.
  `PesticideLocationsParams` keeps its shape (area & filters & RequestOptions).

- [ ] **Step 1: Write the failing tests** in `get_pesticide_locations_test.ts`

```ts
Deno.test("getPesticideLocations with no area asks for the valley", async () => {
  const url = await paramsFor({});
  assertEquals(url.pathname.endsWith("/pesticides/locations/"), true);
  assertEquals([...url.searchParams.keys()], []);
});

Deno.test("getPesticideLocations with no argument sends no params", async () => {
  const url = await paramsFor(undefined);
  assertEquals([...url.searchParams.keys()], []);
});

Deno.test("the valley form still filters by type and county", async () => {
  const { searchParams } = await paramsFor({
    type: "child_care",
    county: "fresno",
  });
  assertEquals(searchParams.get("type"), "child_care");
  assertEquals(searchParams.get("county"), "fresno");
  for (const key of ["bbox", "region", "buffer", "lat", "lng", "radius"]) {
    assertEquals(searchParams.has(key), false, key);
  }
});

Deno.test("a union-typed area sends the member it holds", async () => {
  const areas: Array<PesticideLocationsArea> = [
    {},
    { region: "abc12", buffer: 1 },
    { lat: 36.74, lng: -119.79 },
    { bbox: [0, 0, 1, 1] },
  ];
  const sent = [];
  for (const area of areas) {
    sent.push([...(await paramsFor(area)).searchParams.keys()].sort());
  }
  assertEquals(sent, [[], ["buffer", "region"], ["lat", "lng"], ["bbox"]]);
});

Deno.test("radius or buffer without their area doesn't compile", () => {
  // @ts-expect-error: radius needs lat and lng (the server answers 400)
  const _radius: PesticideLocationsParams = { radius: 2 };
  // @ts-expect-error: buffer needs a region (the server answers 400)
  const _buffer: PesticideLocationsParams = { buffer: 1 };
  // @ts-expect-error: one area at a time
  const _both: PesticideLocationsParams = { bbox: [0, 0, 1, 1], region: "x" };
});
```

`paramsFor` takes `Parameters<typeof getPesticideLocations>[0]`, which now
includes `undefined`. Import the two types from `./get_pesticide_locations.ts`.

- [ ] **Step 2: Run to see them fail**

Run:
`deno test --allow-net --allow-env --env-file=../../.env lib/pesticides/get_pesticide_locations_test.ts`.
Expected: type errors (`{}` is not assignable, and an `@ts-expect-error` is
unused).

- [ ] **Step 3: Implement**

The type decision is spelled out because the tests above depend on it:

```ts
/** Every area key, none of them set: the base each area form overrides. */
type NoArea = {
  bbox?: never;
  region?: never;
  buffer?: never;
  lat?: never;
  lng?: never;
  radius?: never;
};

export type PesticideLocationsArea =
  | NoArea // the whole valley
  | (Omit<NoArea, "bbox"> & { bbox: [...] })
  | (Omit<NoArea, "region" | "buffer"> & { region: string; buffer?: 0 | 1 | 3 | 5 })
  | (Omit<NoArea, "lat" | "lng" | "radius"> & { lat: number; lng: number; radius?: number });
```

Keep the existing per-field JSDoc on each member, and give the no-area member
its own doc ("no area: every location in the valley"). The signature is
`params: PesticideLocationsParams = {}`. Branch on `params.bbox !== undefined`,
then `params.region !== undefined`, then `params.lat !== undefined`. Otherwise
send no area params.

Rewrite the function JSDoc's "Give a `bbox`, a `region`, or a `lat` and `lng`."
to also cover the no-area form: it returns every school and child care site in
the valley (about 2,800 features, roughly 1.5 MB uncompressed), still filtered
by `type` and `county`, so prefer an area when one is known. Add a valley-wide
call to the module `@example`.

- [ ] **Step 4: Add a live step** in `lib/pesticides/mod_test.ts`, inside
      `Module: Pesticides Endpoints`

Step name: `GET  pesticides/locations/ for the valley (child care)`. Call
`getPesticideLocations({ type: "child_care" })`, validate every feature with
`getSimpleValidationTest(pesticideLocationFeatureSchema)`, assert every
feature's `properties.type === "child_care"`, and `console.warn` if there are no
features. No count assertions.

- [ ] **Step 5: Run the tests**

Run:
`deno test --allow-net --allow-env --env-file=../../.env lib/pesticides/get_pesticide_locations_test.ts lib/request_options_forwarding_test.ts lib/pesticides/mod_test.ts`
(sandbox off). Expected: all pass. A 400 "bbox is required" from the live step
means a stale cache entry or an old server; check before changing code.

- [ ] **Step 6: CHANGELOG and api-urls**

`### Added` (after Task 1's line):

> `getPesticideLocations` with no area (`getPesticideLocations()`, or with only
> `type` / `county`) returns every location in the valley. `radius` and `buffer`
> without their area no longer compile (the server answers 400). Needs a server
> running sjvair.com #351. (from beta.17, #71)

`### Changed`:

> `PesticideLocationsArea`'s forms each name the other forms' keys as `never`,
> so passing two areas at once (e.g. `bbox` and `region`) no longer compiles.
> The SDK sent only the first of them before. (from beta.17, #71)

`api-urls.md:150` becomes
``- [x] `/api/2.0/pesticides/locations/` (no area: the whole valley)``. Run
`deno fmt` and grep both files.

- [ ] **Step 7: Commit**

```bash
git add lib/pesticides CHANGELOG.md api-urls.md
git commit -m "feat(pesticides): valley-wide getPesticideLocations"
```

### Task 3: Beta line and full local verification

**Files:** Modify `CHANGELOG.md` (the betas paragraph, after beta.16).

- [ ] **Step 1:** Append this sentence, then `deno fmt` and grep it:

> **5.0.0-beta.17** (unreleased): location groups on `regions/meta/` and
> valley-wide `getPesticideLocations` (#71, for sjvair.com #351).

- [ ] **Step 2:** From the worktree, run `deno fmt --check`, `deno lint` and
      `deno check` on the whole project. Run
      `deno test --allow-net --allow-env --env-file=../../.env --ignore=lib/account/mod_test.ts`
      (sandbox off; outside :40–:50). Finish with `deno publish --dry-run`.
      Expected: all clean, and any failures that fail on base too are reported
      as such.
- [ ] **Step 3: Commit** `git commit -am "docs: changelog: beta.17 line"`.
