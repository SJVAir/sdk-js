# Period daily statistic

Target: `@sjvair/sdk` `5.0.0-beta.15`, on `release/5.0.0`. Wraps sjvair.com
[#342](https://github.com/SJVAir/sjvair.com/pull/342) (branch
`feature/period-daily-statistic`, checked at head 2984b939; its spec is
`docs/superpowers/specs/2026-11-18-period-daily-statistic-design.md` there).

## Why

The data dashboard colours monthly (and coarser) Maps on the pollutant's daily
AQI scale. A coarse row's `mean` is the mean of the period's hours, which
understates ozone badly. The server now stores the average of the period's daily
figures on every coarse row, names that field per scale in meta, and writes the
current month, quarter, season and year as rows each night. The SDK needs to
type and document all three so a consumer reads the figure through
`scale.period_statistic` without mapping pollutants to fields itself.

## Goals

- Every `MonitorSummary` and `RegionSummary` carries `daily_statistic_mean`,
  `daily_statistic_days` and `daily_statistic_expected_days`.
- Every `Scale` carries `period_statistic` and `period_statistic_label`, with
  `period_statistic` typed so `row[scale.period_statistic]` is `number | null`.
- The coarse summary calls document the nightly current-period row.

## Non-goals

- No new calls or endpoints (the server adds none). `mergeOpenDays` and the
  `...DailyOpen` calls are unchanged; today stays on `daily/open/`.
- No helper that picks a row's figure: indexing by the scale key already does
  it.
- No fallback for servers without these fields (CLAUDE.md "No fallbacks for
  older server responses").

## Server shape (from #342's serializers and `Scale.to_json`)

Row fields, on every row of every summary response (single and bulk, monitors
and regions), after `mean_24h`:

| Field                           | Value                                                                                                                                              |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `daily_statistic_mean`          | Mean of the period's daily figures (the field the scale's `daily_statistic` names); `null` when fewer than ceil(75%) of the expected days have one |
| `daily_statistic_days`          | Days in the period with a non-null daily figure (0 possible)                                                                                       |
| `daily_statistic_expected_days` | Pacific days in the period; on a current-period row, from its start through yesterday                                                              |

All three are `null` on hourly and daily rows, and on entry types without a
`daily_statistic`. On a coarse row of a type with one, `days` and
`expected_days` are set. `is_partial` exists on the server but is not
serialized.

Scale keys, after `daily_statistic_label`, on every scale in every meta response
(monitors, HMS, pesticides, calheatscore, forecasts):

| Key                      | Value                                                                                                                                                                 |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `period_statistic`       | `"daily_statistic_mean"` when `daily_statistic` is set, else `null`                                                                                                   |
| `period_statistic_label` | "Average of daily highest 1-hour averages" (`max_1h`), "Average of daily highest 8-hour averages" (`max_8h`), "Average of 24-hour averages" (`mean_24h`); else `null` |

Current-period rows: each night (monitors 02:15, regions 02:20 Pacific) the
server writes, per coarse resolution, the period holding yesterday, through
yesterday, into the existing tables: `is_final: false`, `max-age=60`. The
regular rollup replaces it when the period ends. Every past period then has a
row, final or not final yet; a period that starts today has none until the next
night. CO coarse rows read `is_final: false` for 28 h after the period ends (its
last day's `max_8h` settles late).

## Approaches

Only one fits; recorded for the record.

1. **Required nullable fields, enum-typed `period_statistic` (picked).** Matches
   how `daily_statistic` is typed and the no-fallbacks rule. A literal `Scale`
   (map-sdk's `NO_SCALE`) must add the two keys.
2. **Optional fields.** Would let older servers parse, which CLAUDE.md rules
   out, and would make consumers handle `undefined` as well as `null`.
3. **`period_statistic` as `z.string()`.** Loses the indexing type: consumers
   would need a cast to read the row.

## Design

- `lib/monitors/schemas/monitor_summary.ts`,
  `lib/regions/schemas/region_summary.ts`: add the three fields as
  `z.number().nullable()`, required, after `mean_24h`, in the interface and the
  object, with JSDoc matching the table above.
- `lib/meta/schemas/scale.ts`: add
  `periodStatisticSchema =
  z.enum(["daily_statistic_mean"])` (with its
  explicit `PeriodStatisticSchema` type, as `DailyStatisticSchema` has), and
  `period_statistic:
  periodStatisticSchema.nullable()`,
  `period_statistic_label:
  z.string().nullable()` on `scaleSchema`, after
  `daily_statistic_label`.
- `lib/meta/types.ts`: export `PeriodStatistic`, documented like
  `DailyStatistic` ("index a coarse row with it: `row[scale.period_statistic]`
  is `number | null`"); export the schema wherever `dailyStatisticSchema` is
  exported.
- Docs: the monthly, quarterly, seasonal and yearly calls (single and bulk,
  monitors and regions) say the list includes the current period's row, through
  yesterday, with `is_final: false` ("so far"); an ended period's row reads
  `is_final: false` until it settles (about a day and a bit for CO); a period
  that starts today has no row yet. The `is_final` JSDoc on both row schemas
  gains the current-period case. The `getMonitorsMeta` example output shows the
  two new keys.
- Fixtures: add the two keys to every scale in the five meta fixtures by hand
  now; recapture from the live local server once #342 is merged and the shared
  stack serves it, before publishing.
- Tests: `lib/summary_figures_test.ts` — rows parse with the new fields, a row
  missing one fails, a coarse row indexes by `PeriodStatistic` to
  `number | null` (compile-time). `lib/meta/mod_test.ts` — scales reject a
  missing `period_statistic` and an unknown value; the monitors meta fixture
  gives pm25 / o3 / co `period_statistic: "daily_statistic_mean"` and their
  labels, and a weather scale `null`. Live summary tests validate what comes
  back and warn on empty, never require counts.
- `api-urls.md`: no new endpoints; no change unless it lists fields.
- `CHANGELOG.md`, under 5.0.0: Added (the three row fields, the two scale keys,
  `PeriodStatistic`, the current-period rows in coarse lists); Breaking (a
  literal `Scale` must now list `period_statistic` and `period_statistic_label`;
  `MonitorSummary` / `RegionSummary` literals the three row fields).

## Constraints

- The beta needs a server running #342; say so in the PR. Re-check the
  serializers and `Scale.to_json` against #342's head before publishing.
- Verify locally (no PR CI): tests, `deno check`, `deno fmt --check`,
  `deno lint`. Never run the account test.

## Left to the builder

- Exact JSDoc wording; where in each call's docs the current-period note goes.
