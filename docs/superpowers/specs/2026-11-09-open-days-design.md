# Daily figures and open days (SDK)

Date: 2026-11-09. The SDK side of sjvair.com #320 (scale averaging and EPA daily
figures, `docs/superpowers/specs/2026-11-09-scale-averaging-design.md`) and #321
(open days and `is_final`, `docs/superpowers/specs/2026-11-09-open-days-design.md`),
for data-dashboard step 4, spec 5 (calendars). Both are merged into sjvair.com
`develop` (47bc9441), not in production. Read those specs and sjvair.com
`CLAUDE.md` ("Scale shape", "Daily peaks", "Open days", "Summary cache rule")
for the server behaviour. This one covers only what `@sjvair/sdk` adds.

## Why

Spec 5's calendars color each day by the figure the pollutant's standard uses:
the 24-hour average for PM, the highest 1-hour average for O3/NO2/SO2, the
highest 8-hour average for CO. The server now says which figure applies (on
every scale), sends the figures on daily summary rows, says whether a row can
still change (`is_final`), and serves today's figures "so far" (plus yesterday's
until its nightly row exists) from separate "open days" endpoints. The
dashboard reads all of it through the SDK.

The dashboard's reading rule (the user's, from the server spec):

- `is_final: false` on today means "so far";
- `is_final: false` on an earlier day means "not final yet";
- a missing row means "no data".

## Scope

On `release/5.0.0`, as **`5.0.0-beta.8`**. No fallbacks for older server
responses: the SDK ships with sjvair.com `develop`, so every field below the
server always sends is required. A beta.8 client needs a server running
sjvair.com `develop` at or after 47bc9441.

### 1. Scales: averaging period and daily statistic

`scaleSchema` (`lib/meta/schemas/scale.ts`) gains three required fields. The
schema is shared by every scale (`monitors/meta/`, `calheatscore/meta/`,
`hms/meta/`, `forecasts/meta/`); all of them send the fields, as `null` where
they don't apply (checked on the local stack, 2026-11-09).

```ts
averaging_hours: 24 | 1 | 8 | null;
daily_statistic: "mean_24h" | "max_1h" | "max_8h" | null;
daily_statistic_label: string | null;
```

- Doc comments: `averaging_hours` is the standard's averaging window (PM2.5/PM10
  24, O3/NO2/SO2 1, CO 8; `null` for AQI, category scales and weather).
  `daily_statistic` names the daily summary row field that judges a day against
  the scale. `daily_statistic_label` is its translated display text ("24-hour
  average", "Highest 1-hour average", "Highest 8-hour average"), `null` when
  `daily_statistic` is.
- **A `DailyStatistic` type** for `"mean_24h" | "max_1h" | "max_8h"`, with a
  `dailyStatisticSchema` (z.enum) it derives from, exported from `lib/meta`
  (my call). `averaging_hours` is a literal union (`z.union` of `z.literal`s),
  not `number` (my call: the server's set is fixed and the dashboard branches on
  nothing else).
- Update the four meta fixtures (`monitors_meta.json`, `calheatscore_meta.json`,
  `hms_meta.json`, `forecasts_meta.json`) with the fields, using the values the
  server sends, and the `getMonitorsMeta` module doc example.

### 2. Summary rows: daily figures and `is_final`

`monitorSummarySchema` and `regionSummarySchema` gain, all required:

```ts
max_1h: number | null;
max_8h: number | null;
mean_24h: number | null;
is_final: boolean;
```

- They're on every row at every resolution (single and bulk, since the bulk
  schemas extend these). Doc comments: the three figures are set only on daily
  rows, and only the one the entry type's scale `daily_statistic` names; a day
  that fails EPA's completeness rule gets `null`. `is_final` is true once the
  row can't change anymore (yesterday's daily row settles about 03:00 Pacific,
  CO's about 28 hours after the day ends); open-day rows are always `false`.
- **Indexing by name.** With the fields on the row type, `row[s]` where
  `s: DailyStatistic` types as `number | null` with no cast. The dashboard
  narrows `scale.daily_statistic` from `null` first. Add a type-level test for
  it (a `const x: number | null = row[s]` that must compile, in a `_test.ts`).
- Update the module doc examples in `get_monitor_summaries.ts`,
  `get_region_summaries.ts` and the bulk files to show the new fields.

### 3. Open-day fetchers

Four new functions. Each takes the usual trailing `options?: RequestOptions`.
They go in the existing summary files, next to the daily fetchers they mirror,
so they're reachable from the existing export paths and the module `mod.ts`
files (my call).

| Function | File | Calls |
| --- | --- | --- |
| `getMonitorSummariesDailyOpen(config, options?)` | `lib/monitors/get_monitor_summaries.ts` | `monitors/<monitorId>/summaries/<entryType>/daily/open/` |
| `getRegionSummariesDailyOpen(config, options?)` | `lib/regions/get_region_summaries.ts` | `regions/<regionId>/summaries/<entryType>/daily/open/` |
| `getMonitorSummariesBulkDailyOpen(config, options?)` | `lib/monitors/get_monitor_summaries_bulk.ts` | `monitors/<entryType>/summaries/daily/open/` |
| `getRegionSummariesBulkDailyOpen(config, options?)` | `lib/regions/get_region_summaries_bulk.ts` | `regions/<entryType>/summaries/daily/open/` |

Configs (my call on names):

```ts
interface MonitorSummaryDailyOpenRequestConfig {
  monitorId: string;
  entryType: MonitorEntryType;
  processor?: string;          // sent only when non-empty, like the daily list; server default '' (raw)
}
// returns Promise<Array<MonitorSummary>>

interface RegionSummaryDailyOpenRequestConfig {
  regionId: string;
  entryType: string;
}
// returns Promise<Array<RegionSummary>>

type MonitorSummaryBulkOpenRequestConfig =
  Omit<MonitorSummaryBulkRequestConfig, "start" | "end">;
  // entryType, bbox?, region?, processor? (processor sent when !== undefined,
  // like the bulk lists; default each monitor's published series)
// returns Promise<Array<MonitorWithSummaries>>

type RegionSummaryBulkOpenRequestConfig =
  Omit<RegionSummaryBulkRequestConfig, "start" | "end">;
  // entryType, region (required)
// returns Promise<Array<RegionWithSummaries>>
```

- **Single-owner** endpoints aren't paginated (`{data: [rows]}`, at most 2 rows):
  use `jsonCall`. They return the same row types as the stored lists. Open rows
  carry the same stats as stored daily rows (the server rolls them up from the
  hours so far with the nightly rollup's code), so no separate open-row type and
  no extra nullability. Every open row has `is_final: false` and
  `resolution: "day"`.
- **Bulk** endpoints page by owner, 100 per page (`page`, `pages`,
  `has_next_page`, like the bulk lists), and never split an owner's rows across
  pages. They list only owners with an hourly row since the first open day; an
  owner can appear with `summaries: []`. Use `fetchAllBulkPages`, then **not**
  `mergeBulkPages` (which joins a split owner's arrays) but a fold that keeps
  one entry per `id` and one row per `timestamp` within it, the first seen
  winning (my call). Pages 2..N are fetched at once and each is built at its own
  instant, so when the owner set shifts (an hourly rollup, midnight, yesterday's
  settle) an owner can appear on two pages; both copies are at most a minute
  apart, so either is fine.
- Doc comments on each say: which days are open (today, plus yesterday until its
  nightly row exists, capped at about 03:00 Pacific), that today reads as
  missing until its first hour is summarized (about 00:45), the reading rule,
  and that responses are `private, max-age=60`.
- **Not exposed:** the bulk monitor endpoint also accepts the server's
  `MonitorFilter` params. The SDK's bulk lists don't expose them either, so the
  open fetcher matches them (my call; not a deferral of anything asked for).

### 4. Merging stored rows with open rows

Two pure functions, generic over the row type so they serve monitors and regions
alike. They live in a new `lib/open_days.ts` with its own export path
`./open-days` in `deno.json`, and are re-exported from `lib/monitors/mod.ts` and
`lib/regions/mod.ts` (my call).

```ts
function mergeOpenDays<T extends { timestamp: string }>(
  stored: ReadonlyArray<T>,
  open: ReadonlyArray<T>,
): Array<T>;

function mergeBulkOpenDays<
  T extends { id: string; summaries: Array<{ timestamp: string }> },
>(
  stored: ReadonlyArray<T>,
  open: ReadonlyArray<T>,
): Array<T>;
```

- **`mergeOpenDays`**: returns stored rows plus every open row whose `timestamp`
  no stored row has, sorted by time (`Date.parse`, since offsets differ between
  -08:00 and -07:00). **The stored row wins** on a shared day: just after a
  nightly rollup the stored list (cached up to a minute) and the open endpoint
  (cached 60 s) can briefly both have the day. Timestamps are compared as the
  server's strings, which both endpoints format the same way (Pacific midnight
  ISO). A timestamp repeated within `open` is kept once, the first winning.
  Inputs aren't mutated.
- **`mergeBulkOpenDays`**: matches owners by `id`. An owner in both gets its
  `summaries` merged with `mergeOpenDays`; an owner only in `stored` is kept
  as is; an owner only in `open` (for example a monitor whose first data is
  today) is added. Order: stored owners in their order, then open-only owners in
  theirs. The owner's other fields come from the stored entry when both have it.
  Duplicate ids within one input are folded into one entry first (the first
  entry's fields, the union of rows with no repeated timestamp), so a caller
  that built `open` by hand gets the same result as the fetcher's output.
- **No range trimming.** Neither function drops open rows outside a date range;
  the caller asks for open days only when its range reaches yesterday or today,
  and the dashboard already trims to its range in `toPoints` (my call).
- The JSDoc carries the reading rule and an example pairing a daily list call
  with its open-days call.

The dashboard keeps its own range splitting, task pool and caching. The SDK
adds no helper that splits a range (the user's decision, 2026-11-09: it would
duplicate `air-quality-fetch.ts`, and separate calls let settled months stay
cached for a day while open days refetch every minute).

### 5. Docs and release

- `api-urls.md`: the four open-day endpoints, checked.
- `CHANGELOG.md`, under 5.0.0: the new fields (Added), the fetchers and merge
  functions (Added), and a `5.0.0-beta.8` line in the betas paragraph naming the
  sjvair.com PRs (#320, #321) and this PR.
- `deno.json` version `5.0.0-beta.8` in a `chore: Release 5.0.0-beta.8` commit.
- The PR says the beta needs a server on sjvair.com `develop` at or after
  47bc9441.
- **Publishing (the tag) needs the user's explicit yes**, every time.

## Tests

- **Schemas, against fixtures:** the four meta fixtures parse with the new scale
  fields; a summary fixture row with figures and `is_final` parses, and one
  missing `is_final` fails.
- **Merges (pure unit tests):** stored wins on a shared day; open-only days are
  added; output sorted across a DST offset change; empty inputs; inputs not
  mutated; bulk: owner in both, stored-only, open-only, `summaries: []`,
  duplicate ids folded.
- **Fetchers, URLs:** each calls the right URL with the right params (processor
  sent or not, `region` repeated, `bbox` joined), using the stubbing pattern in
  the existing tests; bulk folds pages, including an owner repeated on two
  pages (kept once, no repeated day).
- **Request-option forwarding:** add the four to
  `request_options_forwarding_test.ts`.
- **Integration (local stack):** each fetcher against `127.0.0.1:8000`,
  validated with `getSimpleValidationTest`; skipped with a note when the server
  has no open rows (local data gaps). The existing summary integration tests
  validate the new fields on stored rows.
- **Local-only server bug:** on the first request for an owner set in a 60 s
  window, the local stack's Django debug toolbar can answer an open-days
  endpoint with a 500 (production has no toolbar). Each page of a bulk endpoint
  is its own owner set, so each page can 500 once. The SDK doesn't work around
  it. The integration tests warm every page with plain `fetch`es before calling
  the SDK (page 1, then pages 2..`pages`, retrying a 500 once), with a comment
  saying why (my call).
- Never run `lib/account/mod_test.ts` (it writes the shared database and sends
  a text); run the suite with it ignored.

## Out of scope

- A helper that splits a date range into server-sized requests.
- Open rows for other resolutions (the server has only daily).
- Any client-side figure or settle-time logic.
- The bulk monitor endpoint's `MonitorFilter` params.

## Left to the builder

- Exact internal helper names and how the bulk open fetchers share
  search-param code with the bulk lists.
- Fixture contents beyond what's listed above.
