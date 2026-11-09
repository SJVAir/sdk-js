# Alert Current Value (SDK) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `getMonitorAlertCurrent` and the `monitors/meta/` `alerts` field
to `@sjvair/sdk` as `5.0.0-beta.7`.

**Architecture:** One new getter in `lib/monitors/`, following
`get_monitor_details.ts` (`jsonCall`, `RequestOptions`, response cast, no
parse), with a zod schema that has an explicit interface type like its
neighbours, inferred types in `types.ts`, and a fixture.
`sjvairMonitorEntryMetaSchema` gains a nullable `alerts` object.

**Tech Stack:** Deno 2, zod, JSR.

**Spec:** `docs/superpowers/specs/2026-11-08-alert-current-design.md`. The
server side is sjvair.com
`docs/superpowers/specs/2026-11-08-alert-current-design.md` on
`feature/alert-current`.

## Global Constraints

- Branch `feature/alert-current` off `release/5.0.0`; the PR goes into
  `release/5.0.0`.
- Timestamps are ISO strings, never `Date`.
- Status union: `"ok" | "insufficient" | "no_data" | "pending"`.
- No fallbacks for older server responses.
- **Publishing, tags and releases need the user's explicit yes.** None are part
  of this plan.
- Never run account tests (`TEST_ACCOUNTS=1`).
- No Claude or AI attribution in commits.

## Review Focus

1. **An empty `data` record**, from a monitor type with no evaluated pairs,
   returns `{}`, not `undefined`. Task 1 tests it.
2. **Every field except `status` is `null` when `pending`.** The schema must
   accept that, and the type must say so, so the dashboard can't read `value`
   without a null check. Task 1 tests the fixture's pending row against the
   schema.
3. **`previous` can be non-null with a null `value`** (`insufficient` an hour
   ago). Task 1's fixture includes it.
4. **Meta entries with `alerts: null`** must parse. Older fixtures with no
   `alerts` key should fail, since the server always sends it. Task 2 tests
   both.
5. **The monitor id is used as given in the URL**, like `getMonitorDetails`. The
   stubbed-fetch test asserts the path `monitors/<id>/alerts/current/`.

---

### Task 1: `getMonitorAlertCurrent`

**Files:**

- Create: `lib/monitors/get_monitor_alert_current.ts`
- Create: `lib/monitors/schemas/monitor_alert_current.ts`
- Create: `lib/monitors/fixtures/monitor_alert_current.json`
- Modify: `lib/monitors/schemas/mod.ts`, `lib/monitors/types.ts`,
  `lib/monitors/mod.ts`, `deno.json` (`exports`:
  `"./monitors/get_monitor_alert_current"`)
- Modify: `lib/request_options_forwarding_test.ts` (add to the getter table)
- Test: `lib/monitors/mod_test.ts`

**Interfaces:**

- Produces:
  - `monitorAlertStatusSchema`, which is
    `z.enum(["ok", "insufficient", "no_data", "pending"])`
  - `monitorAlertCurrentSchema`, one entry type's result:
    - `status`
    - `value: number | null`
    - `level: string | null`
    - `window: {start: string, end: string} | null`
    - `latest_timestamp: string | null`
    - `readings: number | null`
    - `required: number | null`
    - `previous: {status, value: number | null, level: string | null} | null`
    - `evaluated_at: string | null`
  - `monitorAlertCurrentRecordSchema`, which is
    `z.record(z.string(), monitorAlertCurrentSchema)`
  - Types: `MonitorAlertStatus`, `MonitorAlertCurrent`,
    `MonitorAlertCurrentRecord`
  - `getMonitorAlertCurrent(monitorId: string, options?: RequestOptions): Promise<MonitorAlertCurrentRecord>`

- [ ] **Step 1: Write the fixture:** `{"pm25": ok row, "o3": insufficient row}`,
      plus a separate `"pending"` example inside the test file. Use realistic
      ISO strings with offsets. The ok row's `previous` is
      `{status: "insufficient", value: null, level: null}`.

- [ ] **Step 2: Write the failing tests** (`permissions: { net: false }`)
  - **`monitorAlertCurrentRecordSchema parses the fixture`:**
    `safeParse(fixture).success`.
  - **`monitorAlertCurrentSchema accepts a pending row`:** all fields except
    `status: "pending"` are `null`, and it parses.
  - **`monitorAlertCurrentSchema rejects an unknown status`:** `status: "stale"`
    fails.
  - **`getMonitorAlertCurrent calls alerts/current`:**
    - `stubFetch(jsonResponse({data: fixture}))`
    - the result deep-equals the fixture
    - `stub.calls[0].url.pathname` ends with `/monitors/abc/alerts/current/`;
      match the trailing slash convention `jsonCall` produces, checked against
      another getter's stub test
  - **`getMonitorAlertCurrent returns an empty record`:** `{data: {}}` gives
    `{}`.
  - **Forwarding table:** add
    `["getMonitorAlertCurrent", (o) => getMonitorAlertCurrent("m", o)]`.

- [ ] **Step 3: Run them to verify they fail**

  Run:
  `deno test --allow-net --allow-env lib/monitors/mod_test.ts lib/request_options_forwarding_test.ts`
  Expected: FAIL (module not found)

- [ ] **Step 4: Implement.**
  - The schema files declare an explicit
    `interface ... extends z.ZodObject<...>` like `monitors_meta.ts`, with doc
    comments on each field. The statuses' meanings are copied from the SDK
    spec's "The statuses".
  - The getter's module doc has an `@example`.

- [ ] **Step 5: Run the tests, `deno check`, lint and fmt**

  Run:
  `deno test --allow-net --allow-env lib/monitors/mod_test.ts lib/request_options_forwarding_test.ts && deno check mod.ts && deno lint && deno fmt --check`
  Expected: the new tests pass and there are no check, lint or fmt errors.
  Network-backed tests may skip or fail without a local server; compare them
  with a run on `release/5.0.0` before calling them new.

- [ ] **Step 6: Commit**: `git commit -m "monitors: getMonitorAlertCurrent"`

### Task 2: Meta `alerts` field

**Files:**

- Modify: `lib/monitors/schemas/monitors_meta.ts`
  (`SJVAirMonitorEntryMetaSchema`, `sjvairMonitorEntryMetaSchema`)
- Modify: `lib/monitors/fixtures/monitors_meta.json` (add `alerts` to every
  entry: a block on pm25/o3 where the server evaluates them, `null` elsewhere)
- Modify: `lib/monitors/get_monitors_meta.ts` (module doc example)
- Modify: `lib/monitors/types.ts` (export `MonitorEntryAlertsMeta`)
- Test: `lib/monitors/mod_test.ts`

**Interfaces:**

- Produces:
  - `monitorEntryAlertsMetaSchema`, which is
    `{window: string, min_coverage: number, stage: string, processor: string | null, expected_interval: string | null}`
  - `alerts: monitorEntryAlertsMetaSchema.nullable()` on
    `sjvairMonitorEntryMetaSchema`
  - the type `MonitorEntryAlertsMeta`

- [ ] **Step 1: Write the failing tests**
  - **`entry meta parses an alerts block`:** the PurpleAir pm25 block
    `{window: "60 min", min_coverage: 0.5, stage: "calibrated", processor: "PM25_UnivariateLinearRegression", expected_interval: null}`
    parses.
  - **`entry meta parses alerts null`.**
  - **`entry meta requires alerts`:** an entry without the key fails.
  - **The fixture still parses**, through whichever existing test parses
    `monitorsMetaFixture`; update it if it asserts the shape.

- [ ] **Step 2: Run them to verify they fail**

  Run: `deno test --allow-net --allow-env lib/monitors/mod_test.ts` Expected:
  FAIL

- [ ] **Step 3: Implement** the schema change and update the fixture and doc
      example.

- [ ] **Step 4: Run the tests, check, lint and fmt** (the same command as Task
      1, Step 5)

- [ ] **Step 5: Commit**:
      `git commit -m "monitors: alerts block in monitors meta"`

### Task 3: CHANGELOG and version

**Files:**

- Modify: `CHANGELOG.md`, `deno.json`

- [ ] **Step 1: Update the CHANGELOG**
  - Under `## 5.0.0`, extend the betas paragraph with **5.0.0-beta.7** (today's
    date): `getMonitorAlertCurrent` and the `monitors/meta/` `alerts` field, for
    sjvair.com `#<PR number>`. Use the server PR's number once it's opened;
    leave `#TBD` until then and replace it before the PR is marked ready.
  - Add bullets under the existing "Added" section, or the section the file uses
    for additions.
- [ ] **Step 2: Version**: `deno.json` `"version": "5.0.0-beta.7"`.
- [ ] **Step 3: Run all non-network tests, check, lint and fmt**

  Run:
  `deno test --allow-net --allow-env lib/monitors/mod_test.ts lib/request_options_forwarding_test.ts && deno check mod.ts && deno lint && deno fmt --check`
  Expected: pass

- [ ] **Step 4: Commit**: `git commit -m "5.0.0-beta.7"`

Publishing is not part of this plan. After the PR merges, ask the user for an
explicit yes before any publish or tag.
