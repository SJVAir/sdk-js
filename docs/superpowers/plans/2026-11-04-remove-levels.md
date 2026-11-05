# Remove `levels`, add `school_guidelines` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the SDK's `monitors/meta/` types match sjvair.com spec 5: no
`levels`, a new `school_guidelines` block, and forecast `color` / `aqi_category`
described as scale values.

**Architecture:** Schema changes in `lib/monitors/schemas/monitors_meta.ts`,
inferred types in `lib/monitors/types.ts`, the `EntriesMeta` wrapper in
`lib/monitors/get_monitors_meta.ts`, and fixture-backed stubbed-fetch tests in
`lib/monitors/mod_test.ts`. Forecasts change docs and fixtures only.

**Tech Stack:** Deno 2, TypeScript, Zod (types via `zinfer`), `@std/assert`,
`stubFetch` / `jsonResponse` from `lib/http/fetch_stub_test_utils.ts`.

**Spec:** `docs/superpowers/specs/2026-11-04-remove-levels-design.md`

## Global Constraints

- Work in `.worktrees/remove-levels` on `feature/remove-levels`; PR into
  `release/5.0.0`. Never merge without the user's yes.
- No `v*` tag, publish, version bump or beta. beta.3 is the user's call later.
- No AI attribution in commits, PRs or docs.
- Never run `lib/account` tests (they send a real SMS).
- `school_guidelines` is required and nullable (`.nullable()`, never
  `.optional()`): the server always sends the key.
- Schemas get an explicit `interface ... extends z.ZodObject<...>` with JSDoc
  per field, like the existing ones (JSR slow-types rule).
- Activity keys, in order: `recess`, `pe`, `athletics`, `events`.
- Fixture `source.url`: `https://www.sjvair.com/guidelines/schools/`.
- Commands: tasks run only the stubbed tests named in each step. The live
  `GET monitors/meta` step will fail against a local server without spec 5; that
  is expected and goes in the PR, with no skip added.

## Review Focus

1. A leftover `levels` in the schema still parses (Zod strips unknown keys), so
   only a shape test catches it: Task 2 asserts
   `"levels" in sjvairEntryMetaSchema.shape` is false.
2. A cell's text copied with HTML left in (`&amp;`, `<br />`, `<p>`): Task 1
   asserts no string contains `<` or `&amp;`.
3. An activity whose `levels` keys drift from the pm25 scale's keys (missing or
   extra level): Task 1 compares key lists exactly, in order.
4. A non-pm25 entry type given a block or missing the key: Task 1 asserts every
   other entry has the key, set to `null`.
5. Docs still pointing callers at `asIter.levels` or `name`: Task 2 ends with a
   grep that must come back empty.

---

### Task 1: Add `school_guidelines`

**Files:**

- Modify: `lib/monitors/schemas/monitors_meta.ts`
- Modify: `lib/monitors/types.ts`
- Modify: `lib/monitors/get_monitors_meta.ts`
- Modify: `lib/monitors/fixtures/monitors_meta.json`
- Modify: `lib/monitors/mod_test.ts` (the "Monitors meta scales (stubbed fetch)"
  test, ~line 702)
- Modify: `CHANGELOG.md`

**Interfaces:**

- Produces: `schoolActivitySchema`, `schoolGuidelinesSchema` (exported from
  `monitors_meta.ts`, so from `lib/monitors/schemas/mod.ts`); types
  `SchoolActivity`, `SchoolGuidelines` in `lib/monitors/types.ts`;
  `EntriesMeta.school_guidelines: SchoolGuidelines | null`.
- Consumes: `resolutionSchema` (`lib/meta/schemas/dataset_catalog.ts`),
  `scaleSourceSchema` (`lib/meta/schemas/scale.ts`).

- [ ] **Step 1: Add `school_guidelines` to the fixture**

In `lib/monitors/fixtures/monitors_meta.json`, add `"school_guidelines": null`
to every `entries.<type>` except `pm25`. For `pm25`, add:

```json
"school_guidelines": {
  "label": "Outdoor Activity Guidelines for Schools",
  "resolution": "hour",
  "source": {"name": "SJVAir", "url": "https://www.sjvair.com/guidelines/schools/"},
  "activities": [
    {"key": "recess", "label": "Recess", "duration": "15 minutes", "levels": {...}},
    {"key": "pe", "label": "P.E.", "duration": "1 hour", "levels": {...}},
    {"key": "athletics", "label": "Athletic Practice & Training", "duration": "2-4 hours", "levels": {...}},
    {"key": "events", "label": "Scheduled Sporting Events", "duration": null, "levels": {...}}
  ]
}
```

Each `levels` maps the fixture's pm25 scale keys (`good`, `moderate`,
`unhealthy_sensitive`, `unhealthy`, `very_unhealthy`, `hazardous`) to that
cell's `<p>` texts, in order, copied word for word from sjvair.com
`camp/templates/pages/guidelines/schools.html` (columns left to right are the
levels in scale order; check the header labels match). Plain text: `&amp;`
becomes `&`, no tags. Recess / good is `["No restrictions."]`. If the server
branch (`feature/hardcoded-cleanup`) is running by then, use its real pm25 block
instead, with the URL above.

- [ ] **Step 2: Write the failing test**

Add a step to "Module: Monitors meta scales (stubbed fetch)":

```ts
await t.step("exposes school guidelines for pm25 only", async () => {
  const meta = await fetchMeta(monitorsMetaFixture.data);
  const pm25 = meta.entryType("pm25");
  const guidelines = pm25.school_guidelines;
  assertExists(guidelines);
  assertEquals(guidelines.label, "Outdoor Activity Guidelines for Schools");
  assertEquals(guidelines.resolution, "hour");
  assertEquals(
    guidelines.source.url,
    "https://www.sjvair.com/guidelines/schools/",
  );
  assertEquals(guidelines.activities.map((a) => a.key), [
    "recess",
    "pe",
    "athletics",
    "events",
  ]);
  assertEquals(guidelines.activities.map((a) => a.duration), [
    "15 minutes",
    "1 hour",
    "2-4 hours",
    null,
  ]);
  const levelKeys = pm25.scale!.levels.map((l) => l.key);
  for (const activity of guidelines.activities) {
    assertEquals(Object.keys(activity.levels), levelKeys);
    for (const paragraphs of Object.values(activity.levels)) {
      assert(paragraphs.length > 0);
      for (const text of paragraphs) {
        assert(!text.includes("<") && !text.includes("&amp;"), text);
      }
    }
  }
  assertEquals(guidelines.activities[0].levels.good, ["No restrictions."]);
  for (const entry of meta.asIter.entries) {
    if (entry.type === "pm25") continue;
    assertEquals(entry.school_guidelines, null, entry.type);
  }
  validateMonitorsMeta(monitorsMetaFixture.data);
});
```

Import `assert` from `@std/assert` if it isn't already.

- [ ] **Step 3: Run it to verify it fails**

Run:
`deno test --allow-net --allow-env --filter "stubbed fetch" lib/monitors/mod_test.ts`
Expected: FAIL. A type error that `school_guidelines` doesn't exist on
`EntriesMeta` / `SJVAirEntryMeta`.

- [ ] **Step 4: Implement the schemas, types and getter**

- `schoolActivitySchema`:
  `key: z.enum(["recess", "pe", "athletics", "events"])`, `label: z.string()`,
  `duration: z.string().nullable()`,
  `levels: z.record(z.string(), z.array(z.string()))`.
- `schoolGuidelinesSchema`: `label: z.string()`, `resolution: resolutionSchema`,
  `source: scaleSourceSchema`, `activities: z.array(schoolActivitySchema)`.
- `sjvairEntryMetaSchema` (and its interface): add
  `school_guidelines: schoolGuidelinesSchema.nullable()`.
- `types.ts`: `SchoolActivity` and `SchoolGuidelines` via `zinfer`.
- `EntriesMeta`: `get school_guidelines(): SchoolGuidelines | null`, placed
  after `scale`. JSDoc: outdoor activity guidelines for schools, set only for
  PM2.5, keyed by the scale's level keys, applying to hourly values.

- [ ] **Step 5: Run it to verify it passes**

Run:
`deno test --allow-net --allow-env --filter "stubbed fetch" lib/monitors/mod_test.ts`
Expected: PASS, every stubbed step.

- [ ] **Step 6: CHANGELOG and commit**

Under 5.0.0 → Added: `monitors/meta/` entries gain `school_guidelines`
(`EntriesMeta.school_guidelines`, types `SchoolGuidelines` and
`SchoolActivity`); `null` except for `pm25`. Update the betas line to say this
PR's changes are not in a beta yet.

```bash
deno fmt && deno lint && deno check .
git add -A lib/monitors CHANGELOG.md
git commit -m "feat(monitors): add school_guidelines to monitors meta"
```

### Task 2: Remove `levels`

**Files:**

- Modify: `lib/monitors/schemas/monitors_meta.ts`
- Modify: `lib/monitors/types.ts`
- Modify: `lib/monitors/get_monitors_meta.ts` (wrapper and module example)
- Modify: `lib/monitors/fixtures/monitors_meta.json`
- Modify: `lib/monitors/mod_test.ts`
- Modify: `mod.ts` (example), `lib/account/air-alerts.ts` (comment line ~35)
- Modify: `CHANGELOG.md`

**Interfaces:**

- Consumes: Task 1's `EntriesMeta.school_guidelines` (for the module example).
- Produces: `SJVAirEntryMeta` without `levels`; `EntriesMeta` without `levels`
  or `asIter`. `SJVAirEntryLevel` and `sjvairEntryLevelMetaSchema` no longer
  exist.

- [ ] **Step 1: Write the failing test**

Add a step to the same stubbed test, and import `sjvairEntryMetaSchema` from
`./schemas/monitors_meta.ts`:

```ts
await t.step("has no legacy levels", async () => {
  assertEquals("levels" in sjvairEntryMetaSchema.shape, false);
  const meta = await fetchMeta(monitorsMetaFixture.data);
  const pm25 = meta.entryType("pm25");
  assertEquals("levels" in pm25, false);
  assertEquals("asIter" in pm25, false);
  for (const entry of Object.values(monitorsMetaFixture.data.entries)) {
    assertEquals("levels" in entry, false);
  }
});
```

- [ ] **Step 2: Run it to verify it fails**

Run:
`deno test --allow-net --allow-env --filter "stubbed fetch" lib/monitors/mod_test.ts`
Expected: FAIL on `"levels" in sjvairEntryMetaSchema.shape` (true).

- [ ] **Step 3: Remove `levels`**

- Delete `levels` from `sjvairEntryMetaSchema` and its interface.
- Delete `SJVAirEntryLevelMetaSchema`, `sjvairEntryLevelMetaSchema` and
  `SJVAirEntryLevel` (and its import in `types.ts`).
- Delete `EntriesMeta.asIter`, its constructor assignment, and `get levels()`.
  Keep the constructor's `private meta` parameter.
- Delete every `"levels"` key from `entries.<type>` in the fixture (the
  `scale.levels` arrays stay).
- `get_monitors_meta.ts` module example: replace the `"levels": {...}` block
  with a trimmed `"scale": {...}` (id, label, one level, "other levels omitted")
  and `"school_guidelines": {...}` (label, resolution, one activity, "others
  omitted").
- `mod.ts` example: the level is
  `meta.entryType("pm25").scale?.levels.find((lvl) => lvl.key === sub.level)`.
  It returns `undefined` when the scale has no such key.
- `air-alerts.ts` comment: `level` is a key into the `entry_type`'s
  `scale.levels` in `monitors/meta/`.

- [ ] **Step 4: Run it to verify it passes**

Run:
`deno test --allow-net --allow-env --filter "stubbed fetch" lib/monitors/mod_test.ts`
Expected: PASS.

Run:
`grep -rnE "asIter\.levels|SJVAirEntryLevel|sjvairEntryLevelMetaSchema|\.levels\b" mod.ts lib --include='*.ts' | grep -v "scale" | grep -vE "lib/(hms|calheatscore|forecasts|meta|regions)/"`
Expected: no output.

- [ ] **Step 5: CHANGELOG and commit**

Under 5.0.0 → Breaking: `monitors/meta/` entries no longer have `levels`;
`EntriesMeta.levels`, `EntriesMeta.asIter`, `SJVAirEntryLevel` and
`sjvairEntryLevelMetaSchema` are removed. Use `scale` (a legacy level's `name`
is the scale level's `key`).

```bash
deno fmt && deno lint && deno check .
git add -A lib/monitors mod.ts lib/account/air-alerts.ts CHANGELOG.md
git commit -m "feat(monitors)!: remove legacy levels from monitors meta"
```

### Task 3: Forecast `color` and `aqi_category` docs

**Files:**

- Modify: `lib/forecasts/schemas/forecast.ts` (JSDoc only)
- Modify: `lib/forecasts/fixtures/forecasts_list.json`,
  `lib/forecasts/fixtures/forecast_for_place.json`
- Modify: `lib/forecasts/mod_test.ts`
- Modify: `CHANGELOG.md`

**Interfaces:** none shared.

- [ ] **Step 1: Write the failing test**

In `lib/forecasts/mod_test.ts`, add a stubbed test (use the file's existing stub
helpers and fixture imports) that each fixture forecast's `color` and
`aqi_category` equal the `forecasts_meta.json` `aqi-forecast` scale level whose
`min` is the highest `min` ≤ `aqi_value`:

```ts
// for each forecast in forecasts_list.json and forecast_for_place.json:
assertEquals(forecast.color, level.color);
assertEquals(forecast.aqi_category, level.label);
```

- [ ] **Step 2: Run it to verify it fails**

Run:
`deno test --allow-net --allow-env --filter "<the new test's name>" lib/forecasts/mod_test.ts`
Expected: FAIL. `#ffcb00` doesn't equal `#ffff00`.

- [ ] **Step 3: Update fixtures and docs**

- Fixtures: every forecast here is Moderate (AQI 56–71), so `color` becomes
  `"#ffff00"`.
- `forecast.ts` JSDoc:
  - `color`: the AQI scale level's color for `aqi_value`, a hex string.
  - `aqi_category`: the AQI scale level's label for `aqi_value`.
- `get_forecasts.ts` example (`Fresno Moderate`) stays.

- [ ] **Step 4: Run it to verify it passes**

Same command. Expected: PASS.

- [ ] **Step 5: CHANGELOG and commit**

Under 5.0.0 → Changed: forecast `color` is the AQI scale level's color (was a
blended gradient) and `aqi_category` its label. Types are unchanged.

```bash
deno fmt && deno lint && deno check .
git add -A lib/forecasts CHANGELOG.md
git commit -m "docs(forecasts): color and aqi_category come from the AQI scale"
```

### Task 4: Branch check

- [ ] Run `deno fmt --check && deno lint && deno check .`. Expected: clean.
- [ ] Run
      `deno test --allow-net --allow-env lib/monitors lib/forecasts lib/meta lib/datetime`.
      Expected: every stubbed test passes. The only failure allowed is the live
      `GET monitors/meta` schema step, on `school_guidelines` missing from a
      local server without spec 5. Anything else is checked against local data
      gaps first, then fixed.
- [ ] If the server branch is running locally (ask the coordinator which port),
      run the monitors tests against it with `setOrigin` / the test origin, and
      record the result for the PR.
