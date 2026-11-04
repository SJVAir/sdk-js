# Exact entry bounds by default; whole Pacific days as an opt-in

Release 1, step 3, "Remaining SDK work" item 2 (sdk-js only), for the data
dashboard. Drafted 2026-11-04. Ships in @sjvair/sdk 5.0.0, likely as
`5.0.0-beta.2`.

The requirement is sdk-js `DEFERRED.md` → "Breaking changes (next major
version)" → "Exact entry bounds by default; whole Pacific days as an opt-in"
(decided by the user 2026-10-25, scheduled for 5.0.0 on 2026-11-04). The
decisions below were made by the user in the brainstorming session on 2026-11-04
unless marked as the builder's or the spec writer's call.

## Why

Today `getMonitorEntries` and `getMonitorEntriesCSVUrl` quietly change the
bounds a caller gives: two bounds within five minutes of each other are widened
to whole Pacific days. A caller who wants a short window (the current hour, a
two-minute live refresh) has to know to pass `exact: true`, which was added in
4.8.0-beta.1 so existing callers kept their behavior. The user wants the safe
behavior to be the default: what you ask for is what is sent. Rounding to whole
days becomes something a caller asks for by name.

No stable release has `exact` (JSR `latest` is 4.7.0), so removing it only
affects beta pins.

## Goals

- By default, bounds a caller gives are sent unchanged (only ordered).
- A new opt-in flag, `wholeDays: true`, rounds the range out to whole Pacific
  (`America/Los_Angeles`) days, for any span.
- `exact` is gone: removed from the types and the code, with no replacement
  check.
- The same behavior in `getMonitorEntries`, `getMonitorEntriesCSVUrl` and the
  public `getValidDateRange` (`@sjvair/sdk/datetime`).

## Non-goals

- The export functions (`getMonitorEntriesExportCSVUrl`,
  `getMonitorEntriesExportJSON`). They take `"YYYY-MM-DD"` dates and never
  widen; they are unchanged.
- Changing the defaults for missing bounds.
- Any sjvair.com change. None is needed (the server takes `timestamp__gte` and
  `timestamp__lte` as instants already).
- Out of scope per the brief: the `@sjvair/sdk/documents` move-out, pesticide
  endpoints, `calenviroscreen/meta/`, and the four small follow-ups in
  `DEFERRED.md`.
- Editing monitor-map, mobile, map-sdk or data-dashboard code. Their changes are
  listed below and handed to the data-dashboard coordinator.

## Anti-goals

- Any widening without `wholeDays`, including for bounds within five minutes of
  each other. The five-minute rule is removed, not kept as a default.

## Behavior

`getValidDateRange(timestampGte?, timestampLte?, options?)` is the single place
the rule lives; the two entry functions pass `wholeDays` through to it. "Start
of a Pacific day" is `startOfPacificDay`, "end" is `endOfPacificDay`
(`23:59:59.999` Pacific), from `lib/datetime/pacific.ts`, so DST is handled
there.

### Default (no `wholeDays`, or `wholeDays: false`)

| Bounds given | Result                                                                        |
| ------------ | ----------------------------------------------------------------------------- |
| Both         | Ordered (earlier first) and returned exactly as given, however close or equal |
| Only start   | Start as given → end of the Pacific day 3 days later (unchanged from today)   |
| Only end     | Start of the Pacific day 3 days earlier → end as given (unchanged)            |
| Neither      | Start of the Pacific day 3 days ago → end of today (unchanged)                |

### `wholeDays: true`

The start moves back to the start of its Pacific day and the end moves forward
to the end of its Pacific day, for any span (the user's decision).

- Both given: 9:00 Monday to 3:00 Wednesday (Pacific) → midnight Monday to the
  end of Wednesday. Two bounds a minute apart → that whole Pacific day (or both
  days, if they straddle midnight).
- Only start given: the start snaps to the start of its Pacific day; the default
  end is already the end of a Pacific day. _(Spec writer's call, confirmed in
  playback.)_
- Only end given: the end snaps to the end of its Pacific day; the default start
  is already the start of a Pacific day. _(Spec writer's call, by the same
  reasoning.)_
- Neither given: same as the default (already whole days).

Ordering happens before snapping: the earlier bound is snapped down, the later
one up.

### Removing `exact`

`exact` is deleted from `MonitorEntryRequestConfig`,
`MonitorEntryCSVRequestConfig` and `ValidDateRangeOptions`, and from the code
that reads it. There is no runtime check and no `exact?: never` type. The user's
decision (2026-11-04): it was never in a stable release or used publicly, and
the one caller (the dashboard) moves to the new beta and drops it then. An
`exact` left in a call is simply ignored. `getMonitorEntriesCSVUrl` and
`getValidDateRange` give TypeScript callers an excess-property error on an
object literal; `getMonitorEntries` doesn't, because it is generic over its
config type.

- `wholeDays` is never sent to the server as a query param.

## Tests

Stubbed-fetch tests (`lib/http/fetch_stub_test_utils.ts`, as the existing
`"Module: Monitors request params (stubbed fetch)"` tests do) that assert the
exact `timestamp__gte` / `timestamp__lte` sent, plus pure tests of
`getValidDateRange` in `lib/datetime/mod_test.ts`. Replace today's `exact` tests
rather than keeping them alongside. Cover:

- Default: two bounds within five minutes (and equal bounds) are sent unchanged;
  a long range is sent unchanged; reversed bounds are ordered.
- `wholeDays: true`: a multi-day range snaps out; a short range snaps to its
  day; only-start and only-end cases.
- DST in America/Los_Angeles for 2026: a day on each change (Mar 8, a 23-hour
  day; Nov 1, a 25-hour day) and a range that crosses one, checking the UTC
  instants (e.g. Mar 8 runs `08:00Z` to `06:59:59.999Z` next day).
- Missing-bound defaults unchanged.
- `getMonitorEntriesCSVUrl` produces the same params as `getMonitorEntries`.

Run with the brief's recipe:
`deno fmt --check && deno lint && deno check
mod.ts`, then
`deno test --allow-net --allow-env --allow-read --env-file=.env
--ignore=lib/account,lib/documents`
against the local API (never `lib/account`). Tests must not depend on the
device's time zone.

## Docs in sdk-js

- JSDoc on the three functions, their config types, and the module blocks
  (`get_valid_date_range.ts`, `lib/datetime/mod.ts`, `get_monitor_entries.ts`,
  `get_monitor_entries_csv.ts`): describe the new default and `wholeDays`,
  replace every `exact` example, and fix the module examples whose printed
  output shows widening of two `new Date()` bounds.
- `CHANGELOG.md` → 5.0.0 → **Breaking**: one line saying bounds are now sent as
  given, `wholeDays: true` rounds to whole Pacific days, and `exact` (in the
  betas through 5.0.0-beta.1) was removed. Remove the "`exact: true` on entry
  date ranges" line from 5.0.0 → Added, since it never reached a stable release.
  _(Spec writer's call.)_ Note the change under the beta that ships it.
- `DEFERRED.md`: remove (or mark done) the "Exact entry bounds by default"
  entry, pointing to this spec and the PR.
- Search README and other docs for `exact` and the five-minute widening and
  update any mention.

## Callers outside sdk-js (audited read-only, 2026-11-04)

None of these repos is edited by this work.

| Repo / branches checked                                       | Calls                                                                                                                                                                                                 | Relies on today's widening?                                                                                                                                                                    | What it must do on 5.0                                                                                                                                                               |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| monitor-map `main`, `chore/node-26` (pins `^4.7.0`)           | `getMonitorEntries` in `src/lib/data-chart/requests.ts`; `getMonitorEntriesCSVUrl` in `src/lib/data-chart/DataChart.svelte` (`downloadCSV`). No `exact`.                                              | Barely. Ranges are device-local midnight → end of day or now (`DateRange.ts`). Only "today–today" in the first 5 minutes after midnight hits the widening; on 5.0 that is a near-empty window. | Bump to 5.0. No code change needed; optionally pass `wholeDays: true` if that edge should still show the whole day. Must move before sjvair.com `develop` goes live.                 |
| mobile `main`, `chore/node-26`, `fix/alerts-level` (`^4.6.0`) | None.                                                                                                                                                                                                 | No.                                                                                                                                                                                            | Bump to 5.0 (with the other 5.0 changes) before `develop` goes live.                                                                                                                 |
| map-sdk `main`, `feature/milestone-1` (pins `4.8.0-beta.4`)   | None.                                                                                                                                                                                                 | No.                                                                                                                                                                                            | Nothing for this change beyond pinning a 5.0 beta.                                                                                                                                   |
| data-dashboard `main`, `step-4`, `step-4-spec-1`              | `getMonitorEntries` with `exact: true` in `src/lib/data/adapters/air-quality-fetch.ts` (~line 210, doc comment ~186); `getValidDateRange(..., { exact })` in `air-quality.test.ts` (~lines 615, 631). | No: it opts out.                                                                                                                                                                               | Step 4 drops `exact: true` and its doc comment, and the test's `exact` option, when it pins the beta that ships this. (Left in, `exact` is ignored and the bounds are exact anyway.) |

The monitor-map and mobile items go to the coordinator for data-dashboard
`DEFERRED.md`'s "Production deploy of sjvair.com `develop` → `main`" checklist;
the dashboard item goes to the coordinator for step 4.

## Release

PR into `release/5.0.0` from `feature/exact-entry-bounds`. No merge without the
user's yes. Ships as `5.0.0-beta.2` only with the user's explicit yes for that
specific beta; no tag or publish otherwise. The beta, like beta.1, needs a
server running sjvair.com `develop` (no server change here).

## Left to the builder

- Internal function names and test layout.
