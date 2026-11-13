# Monitor Meta Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Type `monitor_groups`, `monitors[type].group`,
`entries[type].description` and `monitors[type].entries[entry].published` from
`GET /api/2.0/monitors/meta/`, and expose `monitor_groups` on the `MonitorsMeta`
wrapper.

**Architecture:** The Zod schemas in `lib/monitors/schemas/monitors_meta.ts`
gain the fields, the types follow through `zinfer`, and the wrapper classes in
`get_monitors_meta.ts` get getters. `getMonitorsMeta` does no runtime parse, so
the schemas matter for types and test validation only.

**Tech Stack:** Deno 2, TypeScript, Zod, `@std/assert`.

**Spec:** `docs/superpowers/specs/2026-11-12-monitor-meta-groups-design.md`

## Global Constraints

- Branch `feature/monitor-meta-groups`, PR into `release/5.0.0`, for
  `@sjvair/sdk` `5.0.0-beta.10`.
- Every new field is required. No `.optional()` or `.default()`.
- `group` is `z.string().nullable()`, not an enum (decided by the user).
- Types come from schemas via `zinfer`; never write them by hand.
- Schema fields use the `interface ...Schema extends z.ZodObject<{...}>` pattern
  in the file, with a `/** */` doc comment per field.
- No Claude or AI attribution in commits or PR text.
- Never run the bare full suite: `lib/account/mod_test.ts` writes to the shared
  DB and sends SMS. Run the named test files only.

## Review Focus

1. A monitor type with `group: null` (none today) must parse and must not break
   `asIter.monitor_groups`. Test: stubbed meta with a `null` group (Task 2).
2. `monitor_groups` whose record order differs from `order`: `asIter` must sort
   by `order`, not by insertion. Test: stubbed meta with the groups reversed
   (Task 2).
3. A `group` value that isn't a key in `monitor_groups` would leave a client
   without a heading. Test: every non-null `group` is a key, in the fixture
   (Task 1) and the live response (Task 2).
4. `published: false` pairs exist (e.g. airgradient humidity) and must stay
   `false`, not be dropped. Test: the fixture has at least one `false` and one
   `true` (Task 1).
5. Weather entries have `description: null`. `EntriesMeta.description` must
   return `null` for them, not `undefined`. Test: `temperature` (Task 2).

---

### Task 1: Schemas, types and fixture

**Files:**

- Modify: `lib/monitors/schemas/monitors_meta.ts`
- Modify: `lib/monitors/types.ts` (next to `SJVAirEntryMeta`, line ~194)
- Modify: `lib/monitors/fixtures/monitors_meta.json`
- Test: `lib/monitors/mod_test.ts`

**Interfaces:**

- Produces: `monitorGroupSchema` (exported from
  `lib/monitors/schemas/monitors_meta.ts`, so from `schemas/mod.ts` too) and
  `type MonitorGroup = zinfer<typeof monitorGroupSchema>` =
  `{ key: string; label: string; order: number }` in `types.ts`.
  `SJVAirMonitorsMeta.monitor_groups: Record<string, MonitorGroup>`,
  `SJVAirMonitorDeviceMeta.group: string | null`,
  `SJVAirEntryMeta.description: string | null`,
  `SJVAirMonitorEntryMeta.published: boolean`.

- [ ] **Step 1: Write the failing tests**

In `lib/monitors/mod_test.ts`, in the
`"Module: Monitors meta scales (stubbed
fetch)"` block, add a step
`"fixture has groups, descriptions and published"` that reads
`monitorsMetaFixture.data` directly and asserts:

```ts
const data = monitorsMetaFixture.data;
assertEquals(sjvairMonitorsMetaSchema.safeParse(data).success, true);
assertEquals(data.monitor_groups.reference, {
  key: "reference",
  label: "Reference-grade",
  order: 0,
});
assertEquals(data.monitor_groups["low-cost"].order, 1);
for (const monitor of Object.values(data.monitors)) {
  if (monitor.group !== null) assert(monitor.group in data.monitor_groups);
}
assertEquals(data.monitors.purpleair.group, "low-cost");
assertEquals(data.monitors.airnow.group, "reference");
assertEquals(typeof data.entries.pm25.description, "string");
assertEquals(data.entries.temperature.description, null);
const published = Object.values(data.monitors).flatMap((m) =>
  Object.values(m.entries).map((e) => e.published)
);
assert(published.includes(true) && published.includes(false));
```

Also add a strictness step `"meta schema requires the new fields"`: deleting any
one of `monitor_groups`, `monitors.purpleair.group`, `entries.pm25.description`
or `monitors.purpleair.entries.pm25.published` from a `structuredClone` of the
fixture data makes `safeParse(...).success` `false`.

The existing live step already validates the server response with
`validateMonitorsMeta`, so the new required fields are checked live with no new
step here.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test --allow-net --allow-env --env-file lib/monitors/mod_test.ts`
Expected: the new fixture step fails (the current fixture has no
`monitor_groups`), and the strictness step fails (the schema accepts the missing
fields).

- [ ] **Step 3: Add the schema fields**

In `lib/monitors/schemas/monitors_meta.ts`:

- New `monitorGroupSchema` (with its `MonitorGroupSchema` interface):
  `key: z.string()` ("The permanent id of this group"), `label: z.string()`
  ("The group in presentation form"), `order: z.number()` ("Where this group
  sorts; lower first").
- `sjvairMonitorEntryMetaSchema`: `published: z.boolean()` ("Whether the map
  endpoints show this entry type for this monitor type"), after `sensors`.
- `sjvairMonitorDeviceMetaSchema`: `group: z.string().nullable()` ("The
  `monitor_groups` key of this monitor type, or null when it has no grade"),
  after `type`.
- `sjvairEntryMetaSchema`: `description: z.string().nullable()` ("Short plain
  help text for this entry type, or null"), after `type`.
- `sjvairMonitorsMetaSchema`:
  `monitor_groups: z.record(z.string(),
  monitorGroupSchema)` ("The groups
  monitor types are listed under, by id; sort by `order`"), after `monitors`.

In `types.ts`, add `MonitorGroup` with a doc comment, importing
`monitorGroupSchema` alongside the other meta schemas.

- [ ] **Step 4: Refresh the fixture from the local server**

```sh
curl -s http://127.0.0.1:8000/api/2.0/monitors/meta/ \
  | python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))' \
  > lib/monitors/fixtures/monitors_meta.json
deno fmt lib/monitors/fixtures/monitors_meta.json
git diff --stat lib/monitors/fixtures/monitors_meta.json
```

Expected: the diff adds `monitor_groups`, `group` and `description`. Check the
diff for unrelated changes (other fields changing value); if any, say so in the
task report rather than reverting them.

- [ ] **Step 5: Run the tests to verify they pass**

Run:
`deno test --allow-net --allow-env --env-file lib/monitors/mod_test.ts lib/meta/mod_test.ts`
Expected: PASS (`lib/meta/mod_test.ts` also parses this fixture). Then
`deno check lib/monitors/mod.ts` and `deno lint`: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/monitors/schemas/monitors_meta.ts lib/monitors/types.ts lib/monitors/fixtures/monitors_meta.json lib/monitors/mod_test.ts
git commit -m "feat(monitors): type monitor_groups, group, description and published in monitors meta"
```

### Task 2: Wrapper getters, docs and changelog

**Files:**

- Modify: `lib/monitors/get_monitors_meta.ts`
- Modify: `CHANGELOG.md`
- Test: `lib/monitors/mod_test.ts`

**Interfaces:**

- Consumes: `MonitorGroup`, and the new fields on `SJVAirMonitorsMeta` and
  `SJVAirEntryMeta` (Task 1).
- Produces: `MonitorsMeta.monitor_groups: Record<string, MonitorGroup>`,
  `MonitorsMeta.asIter.monitor_groups: Array<MonitorGroup>` (sorted by `order`,
  ascending), `EntriesMeta.description: string | null`.

- [ ] **Step 1: Write the failing tests**

In the stubbed-fetch block, add step
`"exposes monitor groups and
descriptions"`:

```ts
const data = structuredClone(monitorsMetaFixture.data);
data.monitor_groups = {
  "low-cost": data.monitor_groups["low-cost"],
  reference: data.monitor_groups.reference,
};
(data.monitors.purpleair as { group: string | null }).group = null;
const meta = await fetchMeta(data);
assertEquals(meta.monitor_groups.reference.label, "Reference-grade");
assertEquals(
  meta.asIter.monitor_groups.map((g) => g.key),
  ["reference", "low-cost"],
);
assertEquals(meta.monitors.purpleair.group, null);
assertEquals(typeof meta.entryType("pm25").description, "string");
assertEquals(meta.entryType("temperature").description, null);
```

In the live `"Module: Monitors Endpoints"` block, add a step
`"meta groups
cover every grouped monitor type"`: from
`await getMonitorsMeta()`, every non-null `meta.monitors[t].group` is a key of
`meta.monitor_groups`, and `meta.asIter.monitor_groups.length` equals
`Object.keys(meta.monitor_groups).length`.

- [ ] **Step 2: Run it to verify it fails**

Run: `deno test --allow-net --allow-env --env-file lib/monitors/mod_test.ts`
Expected: FAIL on the type check (`monitor_groups` doesn't exist on
`MonitorsMeta`).

- [ ] **Step 3: Implement the getters**

In `get_monitors_meta.ts`:

- `EntriesMeta`: `get description(): string | null`, kept in the class's
  alphabetical getter order (before `epa_aqs_code`).
- `MonitorsMeta.asIter` type and constructor:
  `monitor_groups:
  Array<MonitorGroup>` = `Object.values(meta.monitor_groups)`
  sorted by `order` (sort a copy).
- `MonitorsMeta`: `get monitor_groups(): Record<string, MonitorGroup>`, after
  `monitors`.
- Module `@example`: add `"group": "low-cost"` and `"published": false` to the
  airgradient block, `"description": "Fine particles ..."` to pm25, and a
  `"monitor_groups"` block with both groups, using the server's real text.

- [ ] **Step 4: Run the tests to verify they pass**

Run:
`deno test --allow-net --allow-env --env-file lib/monitors/mod_test.ts lib/meta/mod_test.ts`
Expected: PASS. Then `deno check lib/monitors/mod.ts`, `deno lint`, and
`deno fmt --check`: no errors.

- [ ] **Step 5: CHANGELOG**

In `CHANGELOG.md` under `## 5.0.0`:

- Beta paragraph: append
  `**5.0.0-beta.10** (unreleased): monitor groups,
  entry descriptions and`published`on`monitors/meta/`(#<PR>, for sjvair.com
  #332).`.
  The PR number is filled in once the PR opens.
- `### Added`, first bullet: `monitors/meta/` gains `monitor_groups`
  (`MonitorGroup`: `key`, `label`, `order`; `MonitorsMeta.monitor_groups` and
  `asIter.monitor_groups`, sorted by `order`), `group` on each monitor type (a
  `monitor_groups` key, or `null`), `description` on each entry type
  (`EntriesMeta.description`, `null` for weather and `particulates`), and
  `published` on each monitor type's entries. Required.
- `### Breaking`: extend the "Metadata fields the server now always sends are
  required" bullet, or add one, saying hand-built `monitors/meta/` objects
  (mocks, fixtures) must add the four fields.

- [ ] **Step 6: Commit**

```bash
git add lib/monitors/get_monitors_meta.ts lib/monitors/mod_test.ts CHANGELOG.md
git commit -m "feat(monitors): expose monitor_groups and entry descriptions on MonitorsMeta"
```
