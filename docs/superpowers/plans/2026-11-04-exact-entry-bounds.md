# Exact entry bounds by default Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entry bounds a caller gives are sent unchanged by default;
`wholeDays: true` rounds any range out to whole Pacific days; `exact` is
deleted.

**Architecture:** The rule lives once, in `getValidDateRange`
(`lib/datetime/get_valid_date_range.ts`). `getMonitorEntries` and
`getMonitorEntriesCSVUrl` forward `wholeDays` to it. Day snapping uses the
existing `startOfPacificDay` / `endOfPacificDay` / `addPacificDays` from
`lib/datetime/pacific.ts`, which already handle DST.

**Tech Stack:** Deno 2, TypeScript, `@std/assert`, the repo's `stubFetch`
(`lib/http/fetch_stub_test_utils.ts`).

**Spec:** `docs/superpowers/specs/2026-11-04-exact-entry-bounds-design.md`

## Global Constraints

- Work in `/home/alex/workspace/sjvair/sdk-js/.worktrees/exact-entry-bounds`,
  branch `feature/exact-entry-bounds` (from `origin/release/5.0.0`). PR into
  `release/5.0.0`; never merge without the user's yes.
- Never push a `v*` tag, run `deno publish`, or bump `deno.json`'s version.
- No Claude or AI attribution in commits, PRs or docs.
- Option name is exactly `wholeDays?: boolean` (default `false`). `exact` is
  removed everywhere: no `exact?: never`, no runtime check.
- `wholeDays` is never sent as a query param.
- The export functions (`get_monitor_entries_export.ts`) are not touched.
- Tests must pass in any device time zone (the Pacific helpers make this so;
  don't use local-time `Date` constructors in assertions).
- Checks: `deno fmt --check && deno lint && deno check mod.ts`. Tests:
  `deno test --allow-net --allow-env --allow-read --env-file=.env --ignore=lib/account,lib/documents`
  (copy `.env` from the main checkout `/home/alex/workspace/sjvair/sdk-js/.env`
  first; it is gitignored). Never run `lib/account`. `deno doc --lint` has 17
  old errors; don't add new ones, don't fix old ones.

## Review Focus

1. Two bounds within five minutes (or equal) with no flag must come back
   unchanged; any leftover five-minute logic is the bug this work removes.
   Pinned in Task 1 and Task 2.
2. `wholeDays` with reversed bounds: order first, then snap the earlier down and
   the later up. Pinned in Task 1 ("reversed bounds snap after ordering").
3. A range straddling Pacific midnight with `wholeDays` covers both days. Pinned
   in Task 1.
4. A DST-change day (23 h on 2026-03-08, 25 h on 2026-11-01) snaps to the right
   UTC instants. Pinned in Task 1.
5. `wholeDays: false` behaves exactly like omitting it. Pinned in Task 1.

---

### Task 1: `getValidDateRange` sends bounds as given; `wholeDays` opt-in

**Files:**

- Modify: `lib/datetime/get_valid_date_range.ts` (whole file: module JSDoc,
  `ensureValidRange`, `ValidDateRangeOptions`, `getValidDateRange`)
- Modify: `lib/datetime/mod.ts` (module JSDoc example only, lines ~24-26)
- Test: `lib/datetime/mod_test.ts` (replace the
  `"bounds within five minutes
  span the Pacific day"` step at ~153 and the
  whole `"getValidDateRange exact option"` test at ~184-260)

**Interfaces:**

- Produces:
  ```ts
  export interface ValidDateRangeOptions {
    /** Round the range out to whole Pacific days. @defaultValue false */
    wholeDays?: boolean;
  }
  export function getValidDateRange(
    timestampGte?: Date | string | number,
    timestampLte?: Date | string | number,
    options?: ValidDateRangeOptions,
  ): { gte: Date; lte: Date };
  ```

Behavior (from the spec):

| Bounds given | Default                                                      | `wholeDays: true`                                                    |
| ------------ | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| Both         | ordered, returned as given                                   | ordered, then `startOfPacificDay(earlier)`, `endOfPacificDay(later)` |
| Only start   | start as given → `endOfPacificDay(addPacificDays(start, 3))` | `startOfPacificDay(start)` → same end                                |
| Only end     | `startOfPacificDay(addPacificDays(end, -3))` → end as given  | same start → `endOfPacificDay(end)`                                  |
| Neither      | unchanged (3 Pacific days back → end of today)               | same as default                                                      |

- [ ] **Step 1: Write the failing tests** in `lib/datetime/mod_test.ts`.

  Delete the `"bounds within five minutes span the Pacific day"` step and the
  whole `"getValidDateRange exact option"` test. Add:

  ```ts
  Deno.test("getValidDateRange sends given bounds unchanged", async (t) => {
    await t.step("two bounds 2 minutes apart", () => {
      const r = getValidDateRange(
        "2026-10-23T05:00:00Z",
        "2026-10-23T05:02:00Z",
      );
      assertEquals(r.gte.toISOString(), "2026-10-23T05:00:00.000Z");
      assertEquals(r.lte.toISOString(), "2026-10-23T05:02:00.000Z");
    });
    await t.step("identical bounds give a zero-width range", () => {
      const r = getValidDateRange(
        "2026-10-23T05:00:00Z",
        "2026-10-23T05:00:00Z",
      );
      assertEquals(r.gte.toISOString(), "2026-10-23T05:00:00.000Z");
      assertEquals(r.lte.toISOString(), "2026-10-23T05:00:00.000Z");
    });
    await t.step("wholeDays: false and {} match the default", () => {
      for (const options of [undefined, {}, { wholeDays: false }]) {
        const r = getValidDateRange(
          "2026-10-23T05:00:00Z",
          "2026-10-23T05:02:00Z",
          options,
        );
        assertEquals(r.gte.toISOString(), "2026-10-23T05:00:00.000Z");
        assertEquals(r.lte.toISOString(), "2026-10-23T05:02:00.000Z");
      }
    });
  });

  Deno.test("getValidDateRange wholeDays", async (t) => {
    const whole = { wholeDays: true };
    const check = (
      gte: string | undefined,
      lte: string | undefined,
      want: [string, string],
    ) => {
      const r = getValidDateRange(gte, lte, whole);
      assertEquals([r.gte.toISOString(), r.lte.toISOString()], want);
    };

    await t.step(
      "9:00 Mon to 3:00 Wed becomes midnight Mon to end of Wed",
      () =>
        check("2026-11-02T17:00:00Z", "2026-11-04T11:00:00Z", [
          "2026-11-02T08:00:00.000Z",
          "2026-11-05T07:59:59.999Z",
        ]),
    );
    await t.step(
      "a 2-minute window becomes its Pacific day",
      () =>
        check("2026-10-23T05:00:00Z", "2026-10-23T05:02:00Z", [
          "2026-10-22T07:00:00.000Z",
          "2026-10-23T06:59:59.999Z",
        ]),
    );
    await t.step(
      "a window straddling Pacific midnight covers both days",
      () =>
        check("2026-10-23T06:59:00Z", "2026-10-23T07:01:00Z", [
          "2026-10-22T07:00:00.000Z",
          "2026-10-24T06:59:59.999Z",
        ]),
    );
    await t.step(
      "reversed bounds snap after ordering",
      () =>
        check("2026-11-04T11:00:00Z", "2026-11-02T17:00:00Z", [
          "2026-11-02T08:00:00.000Z",
          "2026-11-05T07:59:59.999Z",
        ]),
    );
    await t.step(
      "DST start day 2026-03-08 is 23 hours",
      () =>
        check("2026-03-08T20:00:00Z", "2026-03-08T20:00:00Z", [
          "2026-03-08T08:00:00.000Z",
          "2026-03-09T06:59:59.999Z",
        ]),
    );
    await t.step(
      "DST end day 2026-11-01 is 25 hours",
      () =>
        check("2026-11-01T20:00:00Z", "2026-11-01T20:00:00Z", [
          "2026-11-01T07:00:00.000Z",
          "2026-11-02T07:59:59.999Z",
        ]),
    );
    await t.step(
      "a range across the March change",
      () =>
        check("2026-03-07T20:00:00Z", "2026-03-10T20:00:00Z", [
          "2026-03-07T08:00:00.000Z",
          "2026-03-11T06:59:59.999Z",
        ]),
    );
    await t.step(
      "start only snaps the start",
      () =>
        check("2026-10-30T19:00:00Z", undefined, [
          "2026-10-30T07:00:00.000Z",
          "2026-11-03T07:59:59.999Z",
        ]),
    );
    await t.step(
      "end only snaps the end",
      () =>
        check(undefined, "2026-11-02T20:00:00Z", [
          "2026-10-30T07:00:00.000Z",
          "2026-11-03T07:59:59.999Z",
        ]),
    );
    await t.step("neither bound matches the default", () => {
      const r = getValidDateRange(undefined, undefined, whole);
      assertEquals(r.lte.getTime(), endOfPacificDay(new Date()).getTime());
      assertEquals(
        r.gte.getTime(),
        startOfPacificDay(addPacificDays(r.lte, -3)).getTime(),
      );
    });
    await t.step("does not mutate Date arguments", () => {
      const start = new Date("2026-10-23T05:00:00Z");
      const end = new Date("2026-10-23T05:02:00Z");
      getValidDateRange(start, end, whole);
      assertEquals(start.toISOString(), "2026-10-23T05:00:00.000Z");
      assertEquals(end.toISOString(), "2026-10-23T05:02:00.000Z");
    });
    await t.step("an unparseable bound is still rejected", () => {
      assertThrows(
        () => getValidDateRange("nope", "2026-10-23T05:00:00Z", whole),
        Error,
        "cannot be used",
      );
    });
  });
  ```

  Keep the existing `"start only"`, `"end only"`,
  `"reversed bounds are
  sorted"`, `"does not mutate"` and
  `"rejects an unparseable bound"` steps of
  `"getValidDateRange snaps days in Pacific time"` as they are (they pin the
  unchanged defaults).

- [ ] **Step 2: Run to verify they fail**

  Run: `TZ=Asia/Tokyo deno test lib/datetime/mod_test.ts` Expected: type-check
  error on `wholeDays` (not in `ValidDateRangeOptions`).

- [ ] **Step 3: Implement** in `lib/datetime/get_valid_date_range.ts`: replace
      `exact` with `wholeDays` in `ValidDateRangeOptions`; delete the
      five-minute rule from `ensureValidRange` (it orders, then snaps both ends
      only when `wholeDays`); in the one-bound branches, snap the given bound
      when `wholeDays`. Rewrite the JSDoc (module block, the option, the
      function's bullet list and `@example`) for the new default and
      `wholeDays`, with no mention of `exact` or five minutes; the module
      example `getValidDateRange(new Date(), new Date())` must no longer show a
      widened day (show a `wholeDays: true` example instead). Make the same
      example fix in `lib/datetime/mod.ts`'s module JSDoc.

- [ ] **Step 4: Run to verify they pass**

  Run:
  `TZ=Asia/Tokyo deno test lib/datetime/mod_test.ts && TZ=America/Los_Angeles deno test lib/datetime/mod_test.ts && TZ=UTC deno test lib/datetime/mod_test.ts`
  Expected: all PASS. (`deno check mod.ts` still fails until Task 2: the entry
  functions still pass `exact`.)

- [ ] **Step 5: Commit**

  ```bash
  git add lib/datetime
  git commit -m "feat(datetime)!: send given bounds unchanged; wholeDays rounds to Pacific days"
  ```

### Task 2: Entry functions forward `wholeDays`; docs

**Files:**

- Modify: `lib/monitors/get_monitor_entries.ts` (`MonitorEntryRequestConfig`
  `exact` field ~79-97, the constructor call ~133-137, function JSDoc ~153)
- Modify: `lib/monitors/get_monitor_entries_csv.ts`
  (`MonitorEntryCSVRequestConfig` `exact` field ~75-93, JSDoc ~100, the call
  ~107-111)
- Test: `lib/monitors/mod_test.ts`, in
  `"Module: Monitors request params
  (stubbed fetch)"`: replace the steps
  `"getMonitorEntries exact sends the
  exact instants, no widening"`,
  `"getMonitorEntries without exact still widens
  close bounds"` and
  `"getMonitorEntriesCSVUrl exact keeps the exact
  instants"` (~570-630)
- Modify: `CHANGELOG.md`, `DEFERRED.md`

**Interfaces:**

- Consumes: `getValidDateRange(gte, lte, { wholeDays })` from Task 1.
- Produces: `wholeDays?: boolean` on `MonitorEntryRequestConfig` and
  `MonitorEntryCSVRequestConfig`; `exact` gone from both.

- [ ] **Step 1: Write the failing tests** (replacing the three steps above):

  - `"getMonitorEntries sends close bounds unchanged by default"`: stubbed
    fetch, `timestampGte: new Date("2026-10-22T18:00:30.250Z")`,
    `timestampLte: new Date("2026-10-22T18:02:10.500Z")`, no flag → params
    `timestamp__gte` `"2026-10-22T18:00:30.250Z"`, `timestamp__lte`
    `"2026-10-22T18:02:10.500Z"`.
  - `"getMonitorEntries wholeDays rounds to Pacific days"`:
    `timestampGte:
    "2026-11-02T17:00:00Z"`,
    `timestampLte: "2026-11-04T11:00:00Z"`, `wholeDays: true` →
    `"2026-11-02T08:00:00.000Z"` and `"2026-11-05T07:59:59.999Z"`;
    `params.has("wholeDays")` is `false`.
  - `"getMonitorEntriesCSVUrl sends close bounds unchanged by default"`: same
    inputs and expectations as the first step.
  - `"getMonitorEntriesCSVUrl wholeDays rounds to Pacific days"`: same inputs
    and expectations as the second step, including no `wholeDays` param.

- [ ] **Step 2: Run to verify they fail**

  Run:
  `deno test --allow-net --allow-env --allow-read --env-file=.env lib/monitors/mod_test.ts --filter "stubbed fetch"`
  Expected: type-check error on `wholeDays`.

- [ ] **Step 3: Implement**: in both config types, replace the `exact` field
      with `wholeDays?: boolean` (JSDoc: "Round the range out to whole Pacific
      days: the start to the start of its day, the end to the end of its day.
      Without it, the bounds are sent as given." plus an `@example` and
      `@defaultValue false`). Pass `{ wholeDays: config.wholeDays }` to
      `getValidDateRange`. Update the function JSDoc
      `(including the optional
  processor, stage and wholeDays)`. In
      `get_monitor_entries_csv.ts`'s module example
      (`timestampGte: new Date(), timestampLte: new Date()` printing a whole
      day), either add `wholeDays: true` or change the printed output so it
      matches the new behavior.

- [ ] **Step 4: Update `CHANGELOG.md`** (5.0.0):
  - Under **Breaking**, add: "Entry date ranges (`getMonitorEntries`,
    `getMonitorEntriesCSVUrl`, `getValidDateRange`) send the bounds you give
    unchanged; they no longer widen two bounds within five minutes of each other
    to whole Pacific days. Pass `wholeDays: true` to round a range out to whole
    Pacific days. `exact` (5.0.0-beta.1 and earlier betas) is removed."
  - Remove the Added line "`exact: true` on entry date ranges, to send bounds
    unchanged."
  - Remove the "Exact entry bounds by default…" bullet from **Planned for
    5.0.0**.
  - Don't add a beta.2 line to "Betas:"; that happens in the release commit,
    with the user's yes.

- [ ] **Step 5: Update `DEFERRED.md`**: remove the "Exact entry bounds by
      default; whole Pacific days as an opt-in" entry from "Breaking changes
      (next major version)" (it's done; the spec and CHANGELOG record it). Leave
      the rest of the file alone.

- [ ] **Step 6: Search for leftovers**

  Run:
  `grep -rn "exact\b\|five minutes\|5 minutes\|widen" lib mod.ts README.md CLAUDE.md CHANGELOG.md api-urls.md | grep -v _test.ts`
  Expected: no hits about entry bounds (pesticide "exact match" lines and
  `toApiTimestamp`'s "exact instant" are unrelated and stay).

- [ ] **Step 7: Full checks and tests**

  Run:
  `cp -n /home/alex/workspace/sjvair/sdk-js/.env .env; deno fmt --check && deno lint && deno check mod.ts && deno test --allow-net --allow-env --allow-read --env-file=.env --ignore=lib/account,lib/documents`
  Expected: all PASS against the local API at 127.0.0.1:8000 (steps that need
  data a local copy lacks are skipped with a note, as today). Also run
  `TZ=Asia/Tokyo deno test lib/datetime/mod_test.ts` once more.

- [ ] **Step 8: Commit**

  ```bash
  git add lib/monitors CHANGELOG.md DEFERRED.md
  git commit -m "feat(monitors)!: entry bounds sent as given; wholeDays replaces exact"
  ```

## After the tasks (session owner, not the implementer)

- Push the branch and open a PR into `release/5.0.0`. The PR body says it needs
  a server running sjvair.com `develop` (no server change in this PR), lists the
  signature change (`exact` → `wholeDays`, new default), and lists the callers'
  changes from the spec. No merge without the user's yes.
- Tell the coordinator the PR is open and the signature change.
- Cutting `5.0.0-beta.2` is a separate step that needs the user's explicit yes.
