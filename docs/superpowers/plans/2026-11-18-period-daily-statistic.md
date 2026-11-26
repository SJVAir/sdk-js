# Period Daily Statistic Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> superpowers:subagent-driven-development (recommended) or
> superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Type and document sjvair.com #342's period daily statistic in
`@sjvair/sdk` `5.0.0-beta.15`: three row fields, two scale keys, and the nightly
current-period rows.

**Architecture:** Schema-only change plus docs. The summary row Zod schemas gain
three required nullable numbers; the scale schema gains a required enum-typed
`period_statistic` and a nullable label, with a new exported `PeriodStatistic`
type. No calls change.

**Tech Stack:** Deno 2, TypeScript, Zod, `@std/assert`.

**Spec:** `docs/superpowers/specs/2026-11-18-period-daily-statistic-design.md`

## Global Constraints

- Work on branch `feature/period-daily-statistic` (from `release/5.0.0`), in the
  main checkout. The PR goes into `release/5.0.0`.
- New fields are required: `.nullable()` only, never `.optional()` or
  `.default()` (CLAUDE.md "No fallbacks for older server responses").
- Server values, verbatim: `period_statistic` is `"daily_statistic_mean"` or
  `null`; labels "Average of daily highest 1-hour averages" (`max_1h`), "Average
  of daily highest 8-hour averages" (`max_8h`), "Average of 24-hour averages"
  (`mean_24h`).
- JSON key order follows the server: row fields after `mean_24h`; scale keys
  after `daily_statistic_label`.
- No Claude or AI attribution in commits, PR text, docs or comments: no
  `Co-Authored-By` or session trailers.
- No to-do lists for other projects in docs, CHANGELOG or PR (map-sdk's
  `NO_SCALE` is the coordinator's; the CHANGELOG states the breaking change from
  the SDK's side only).
- Never run `lib/account/mod_test.ts`. Full-suite command:
  `deno test --allow-net --allow-env --env-file --ignore=lib/account/mod_test.ts`.
- No PR CI: verify locally with `deno check **/*.ts`, `deno fmt --check`,
  `deno lint`. After `deno fmt`, re-check wrapped code spans and grep CHANGELOG
  edits.
- Say package versions in full (`@sjvair/sdk` `5.0.0-beta.15`).
- Do not bump `deno.json`, tag or publish: that is a separate step needing the
  user's explicit yes.

## Review Focus

1. A daily or hourly row (all three new fields `null`) must parse — Task 1 test.
2. A coarse row with `daily_statistic_days: 0` and `daily_statistic_mean: null`
   must parse — Task 1 test.
3. A weather/category scale with `period_statistic: null` and
   `period_statistic_label: null` must parse — Task 2 test.
4. A `period_statistic` other than `"daily_statistic_mean"` (e.g. `"mean"`, or a
   daily statistic such as `"mean_24h"`) must be rejected — Task 2 test.
5. Hand-written row literals in other tests (`open_days_fetch_test.ts`,
   `monitors/mod_test.ts`, `regions/get_region_summaries_bulk_test.ts`) must
   gain the fields, or they stop compiling or parsing — Task 1 step.

---

### Task 1: Summary row fields

**Files:**

- Modify: `lib/monitors/schemas/monitor_summary.ts`,
  `lib/regions/schemas/region_summary.ts`
- Modify (row literals): `lib/open_days_fetch_test.ts`,
  `lib/monitors/mod_test.ts`, `lib/regions/get_region_summaries_bulk_test.ts`
- Test: `lib/summary_figures_test.ts`

**Interfaces:**

- Produces: `MonitorSummary` and `RegionSummary` (types, unchanged names) with
  `daily_statistic_mean: number | null`, `daily_statistic_days: number | null`,
  `daily_statistic_expected_days: number | null`.

- [ ] **Step 1: Write the failing tests** in `lib/summary_figures_test.ts`. Add
      the three fields (all `null`) to the `monitorRow` literal (after
      `mean_24h`) so `regionRow` inherits them. Add:

```ts
const coarseRow = {
  ...monitorRow,
  timestamp: "2026-11-01T00:00:00-07:00",
  resolution: "month",
  mean_24h: null,
  daily_statistic_mean: null,
  daily_statistic_days: 0,
  daily_statistic_expected_days: 17,
} as const;

Deno.test("rows require the period daily statistic fields", () => {
  for (
    const key of [
      "daily_statistic_mean",
      "daily_statistic_days",
      "daily_statistic_expected_days",
    ]
  ) {
    assertEquals(
      monitorSummarySchema.safeParse(without(monitorRow, key)).success,
      false,
    );
    assertEquals(
      regionSummarySchema.safeParse(without(regionRow, key)).success,
      false,
    );
  }
});

Deno.test("a coarse row with no qualifying days parses", () => {
  assertEquals(monitorSummarySchema.safeParse(coarseRow).success, true);
  assertEquals(
    monitorSummarySchema.safeParse({
      ...coarseRow,
      daily_statistic_mean: 41.2,
      daily_statistic_days: 15,
    }).success,
    true,
  );
});
```

The existing "monitor row parses" / "region row parses" tests cover Review Focus
1 (all-null daily row).

- [ ] **Step 2: Run and see it fail**

Run: `deno test lib/summary_figures_test.ts` Expected: FAIL — "rows require the
period daily statistic fields" (missing keys still parse).

- [ ] **Step 3: Add the fields to both schemas**: in each interface and each
      `z.object`, after `mean_24h`, `z.number().nullable()` /
      `z.ZodNullable<z.ZodNumber>`. JSDoc:
  - `daily_statistic_mean`: the mean of the period's daily figures (the field
    the scale's `daily_statistic` names; read it through
    `scale.period_statistic`); set only on monthly and coarser rows of an entry
    type with a `daily_statistic`; `null` when fewer than 75% (rounded up) of
    `daily_statistic_expected_days` have a figure.
  - `daily_statistic_days`: days in the period with a daily figure (0 is
    possible); `null` on hourly and daily rows and on entry types without a
    `daily_statistic`.
  - `daily_statistic_expected_days`: Pacific days in the period; on the current
    period's row, the days from its start through yesterday; `null` as above.
  - Extend `is_final`'s JSDoc on both: the current month's, quarter's, season's
    and year's row (written nightly through yesterday) is `false` until its
    period ends and settles.

- [ ] **Step 4: Fix the other row literals.** Add the three fields (`null`) to
      every summary row literal in `lib/open_days_fetch_test.ts`,
      `lib/monitors/mod_test.ts` and
      `lib/regions/get_region_summaries_bulk_test.ts` (find them with
      `grep -n "mean_24h:"`).

- [ ] **Step 5: Run and see it pass**

Run:
`deno test lib/summary_figures_test.ts && deno check lib/open_days_fetch_test.ts lib/monitors/mod_test.ts lib/regions/get_region_summaries_bulk_test.ts`
Expected: all tests pass; check reports no errors. Then run the network-free
tests in those three files, e.g.
`deno test --allow-env --env-file lib/open_days_fetch_test.ts lib/regions/get_region_summaries_bulk_test.ts`
(if a file needs the local API and it is down, say so rather than skip
silently).

- [ ] **Step 6: Commit**

```bash
git add lib/monitors/schemas/monitor_summary.ts lib/regions/schemas/region_summary.ts lib/summary_figures_test.ts lib/open_days_fetch_test.ts lib/monitors/mod_test.ts lib/regions/get_region_summaries_bulk_test.ts
git commit -m "summaries: period daily statistic row fields (sjvair.com #342)"
```

### Task 2: Scale keys and `PeriodStatistic`

**Files:**

- Modify: `lib/meta/schemas/scale.ts`, `lib/meta/types.ts`,
  `lib/monitors/get_monitors_meta.ts` (example output only)
- Modify fixtures: `lib/monitors/fixtures/monitors_meta.json`,
  `lib/hms/fixtures/hms_meta.json`,
  `lib/pesticides/fixtures/pesticides_meta.json`,
  `lib/calheatscore/fixtures/calheatscore_meta.json`,
  `lib/forecasts/fixtures/forecasts_meta.json`
- Test: `lib/meta/mod_test.ts`, `lib/summary_figures_test.ts`

**Interfaces:**

- Consumes: Task 1's row fields.
- Produces: `periodStatisticSchema` (exported from `lib/meta/schemas/scale.ts`,
  re-exported through `schemas/mod.ts`), type `PeriodStatisticSchema`, type
  `PeriodStatistic = "daily_statistic_mean"` (from `lib/meta/types.ts`);
  `Scale.period_statistic: PeriodStatistic | null`,
  `Scale.period_statistic_label: string | null`.

- [ ] **Step 1: Write the failing tests.** In `lib/meta/mod_test.ts`, "Scale
      averaging fields": `withFields` also sets
      `period_statistic: "daily_statistic_mean"` and
      `period_statistic_label: "Average of 24-hour averages"`; the all-null case
      also sets both to `null`. Add a step:

```ts
await t.step("scale rejects a missing or unknown period_statistic", () => {
  const { period_statistic: _, ...noStat } = withFields({});
  assertEquals(scaleSchema.safeParse(noStat).success, false);
  const { period_statistic_label: _l, ...noLabel } = withFields({});
  assertEquals(scaleSchema.safeParse(noLabel).success, false);
  assertEquals(
    scaleSchema.safeParse(withFields({ period_statistic: "mean_24h" })).success,
    false,
  );
});
```

In "fixture scales carry the server's values" add:
`entries.pm25.scale?.period_statistic === "daily_statistic_mean"`,
`entries.o3.scale?.period_statistic_label === "Average of daily highest 1-hour averages"`,
`entries.co.scale?.period_statistic_label === "Average of daily highest 8-hour averages"`,
and, for one entry type in the fixture whose scale has `daily_statistic: null`
(a weather type, e.g. `temperature`, if it has a scale),
`period_statistic === null` and `period_statistic_label === null`.

In `lib/summary_figures_test.ts`, add a compile-time check mirroring `figure()`:

```ts
function periodFigure(
  row: MonitorSummary | RegionSummary,
  s: PeriodStatistic,
): number | null {
  return row[s];
}

Deno.test("rows index by PeriodStatistic", () => {
  assertEquals(
    periodFigure(
      monitorSummarySchema.parse({
        ...coarseRow,
        daily_statistic_mean: 41.2,
        daily_statistic_days: 15,
      }),
      "daily_statistic_mean",
    ),
    41.2,
  );
});
```

- [ ] **Step 2: Run and see it fail**

Run:
`deno test --allow-net --allow-env --env-file lib/meta/mod_test.ts lib/summary_figures_test.ts`
Expected: FAIL (type error: `PeriodStatistic` not exported; once it is, the
missing-key steps fail).

- [ ] **Step 3: Implement** in `lib/meta/schemas/scale.ts`:
      `PeriodStatisticSchema = z.ZodEnum<{ daily_statistic_mean: "daily_statistic_mean" }>`
      and `periodStatisticSchema = z.enum(["daily_statistic_mean"])`, JSDoc'd
      like `dailyStatisticSchema` ("the coarse summary row field holding the
      average of a period's daily figures"). On `ScaleSchema` / `scaleSchema`,
      after `daily_statistic_label`:
      `period_statistic: periodStatisticSchema.nullable()` (JSDoc: the monthly
      and coarser summary row field to judge a period by against this scale,
      `"daily_statistic_mean"`, or `null` when `daily_statistic` is `null`) and
      `period_statistic_label: z.string().nullable()` (JSDoc: translated display
      text, the three labels verbatim, `null` when `period_statistic` is). In
      `lib/meta/types.ts` import `periodStatisticSchema` and export
      `PeriodStatistic`, documented: "The name of a monthly-and-coarser summary
      row field a scale judges a period by. Index a coarse row with it:
      `row[scale.period_statistic]` is `number | null`."

- [ ] **Step 4: Update the five meta fixtures by hand.** In every scale object,
      insert after `daily_statistic_label`: `period_statistic` =
      `"daily_statistic_mean"` when that scale's `daily_statistic` is non-null,
      else `null`; `period_statistic_label` = the label for its
      `daily_statistic` (verbatim from Global Constraints), else `null`. Use a
      short script (e.g. `deno eval` reading and rewriting the JSON with key
      order preserved, 2-space indent, trailing newline as before); diff each
      file to confirm only those keys changed. In
      `lib/monitors/get_monitors_meta.ts`'s example output, add
      `"period_statistic": "daily_statistic_mean"` and
      `"period_statistic_label": "Average of 24-hour averages"` after
      `daily_statistic_label`.

- [ ] **Step 5: Run and see it pass**

Run:
`deno test --allow-net --allow-env --env-file lib/meta/mod_test.ts lib/summary_figures_test.ts lib/pesticides/mod_test.ts lib/hms/mod_test.ts lib/calheatscore/mod_test.ts lib/forecasts/mod_test.ts`
Expected: fixture and schema steps pass. Live steps against the local API may
fail on the new required scale keys until #342 is merged and served; report
those as expected-for-now, don't loosen the schema.

- [ ] **Step 6: Commit**

```bash
git add lib/meta lib/monitors/get_monitors_meta.ts lib/monitors/fixtures lib/hms/fixtures lib/pesticides/fixtures lib/calheatscore/fixtures lib/forecasts/fixtures lib/summary_figures_test.ts
git commit -m "meta: scale period_statistic and period_statistic_label, PeriodStatistic (sjvair.com #342)"
```

### Task 3: Current-period docs and CHANGELOG

**Files:**

- Modify: `lib/monitors/get_monitor_summaries.ts`,
  `lib/monitors/get_monitor_summaries_bulk.ts`,
  `lib/regions/get_region_summaries.ts`,
  `lib/regions/get_region_summaries_bulk.ts`, `CHANGELOG.md`

**Interfaces:**

- Consumes: Tasks 1–2 names. No code changes.

- [ ] **Step 1: Document the current-period row** on each Monthly, Quarterly,
      Seasonal and Yearly function (16 functions). One shared paragraph per
      function, wording e.g.: "The list includes the current period's row,
      written nightly through yesterday, with `is_final: false` ("so far"). An
      ended period's row stays `is_final: false` until it settles (for CO, about
      28 hours after the period ends). A period that starts today has no row
      yet; today's figures come from the matching `...DailyOpen` call." Where a
      module's top-of-file JSDoc example shows a row, add the three fields to
      it.

- [ ] **Step 2: CHANGELOG**, under `## 5.0.0 (unreleased; betas only)`:
  - Betas paragraph: append "**5.0.0-beta.15** (unreleased): the period daily
    statistic (#PR, for sjvair.com #342)." (fill the PR number when the PR is
    opened).
  - Added: the three row fields on `MonitorSummary` / `RegionSummary` (single
    and bulk); `Scale.period_statistic` / `period_statistic_label`,
    `PeriodStatistic`, `periodStatisticSchema`; the monthly, quarterly, seasonal
    and yearly lists now include the current period's row (through yesterday,
    `is_final: false`). Mark each "(from beta.15, #PR)" as earlier entries do.
  - Breaking: `Scale` now requires `period_statistic` and
    `period_statistic_label`, and `MonitorSummary` / `RegionSummary` require the
    three row fields: code that builds these as literals must list them. Needs a
    server running sjvair.com #342.

- [ ] **Step 3: Verify the whole branch**

Run, in order:
`deno fmt && deno fmt --check && deno lint && deno check **/*.ts && deno test --allow-net --allow-env --env-file --ignore=lib/account/mod_test.ts`
Expected: fmt/lint/check clean. Tests: everything not hitting the live API
passes; live failures only where the local server lacks #342's fields (list
them). Then `grep -n "beta.15\|period_statistic" CHANGELOG.md` to confirm the
edits survived `deno fmt`.

- [ ] **Step 4: Commit**

```bash
git add -A lib CHANGELOG.md
git commit -m "docs: current-period rows on coarse summary calls; changelog for the period daily statistic"
```

### Task 4: Live recapture (after sjvair.com #342 is merged and served)

Waits for the coordinator's word that the shared stack serves #342. Not a
subagent task; the controller runs it.

- [ ] **Step 1:** Re-check #342's head against the spec:
      `git -C
      ../sjvair.com fetch && git -C ../sjvair.com diff 2984b939
      origin/<merged ref> -- camp/api/v2/summaries/serializers.py
      camp/utils/scales.py camp/apps/entries/levels.py`.
      Any change to field names, order or labels goes back into Tasks 1–2.
- [ ] **Step 2:** Check for a stale cached response first, then recapture the
      five meta fixtures from `http://127.0.0.1:8000` (same endpoints the
      fixtures came from) and diff: only the two new keys per scale should
      differ from the hand edits, apart from unrelated data drift (report it).
- [ ] **Step 3:** Re-run the Task 3 Step 3 verification; now live tests must
      pass too. Live summary tests validate rows and warn on empty; never assert
      counts.
- [ ] **Step 4:** Commit `test: recapture meta fixtures from sjvair.com #342`.

Opening the PR, merging, the `chore: Release 5.0.0-beta.15` bump, tagging and
publishing each need the user's explicit yes.
