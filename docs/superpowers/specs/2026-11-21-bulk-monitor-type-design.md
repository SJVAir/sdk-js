# Bulk monitor `type` filter, data set monitor types, valley-wide pesticide use

5.0.0-beta.16. Wraps sjvair.com PR #350 (`feature/bulk-monitor-type`, into
`develop`).

## Why

The data dashboard's Data Portal Air quality section filters monitors by type
(checkboxes), and treats "no Where" as everywhere for every data set. The server
adds both in #350; this beta wraps them.

## Goals

1. **Bulk `type` option.** `MonitorSummaryBulkRequestConfig` gains
   `type?: MonitorTypeId | Array<MonitorTypeId>`, sent as repeated `type`
   params. It covers every bulk monitor summaries function (hourly, daily,
   monthly, quarterly, seasonal, yearly) and the open-days one, since
   `MonitorSummaryBulkOpenRequestConfig` derives from it.
   - `MonitorTypeId = MonitorType | (string & {})`: any string validates, and
     editors still suggest the known ids (`MonitorType`, which includes
     `cimis`). The `monitors/meta/` `type` values are plain strings, so callers
     pass them without a cast, and a type the server adds later works without an
     SDK release. Same "known values are hints" idea as the catalog's
     `geographySchema`.
   - Docs: values are the `monitors/meta/` `monitors[*].type` keys plus the
     opt-in `cimis`, reachable only when named (its raw series, for the weather
     entry types it summarizes). An unknown type is a 400 with
     `errors.type[0].code == "invalid_choice"`; blank values are ignored by the
     server. Combines with `region`, `bbox`, `processor`.
   - Not sent when unset or an empty array.
2. **Data set monitor types.** Every catalog entry (`meta/datasets/`) gains
   `monitor_types` (#350 commit f611cd84, `camp/api/v2/meta/catalog.py`
   `_monitor_types`): a sorted array of monitor type ids, or `null` for data
   sets not made by monitors. Weather is `["cimis"]`; air-quality is every
   enabled non-opt-in type. Its values are exactly what the bulk `type` takes (a
   server test pins that), so a client builds type checkboxes from it and never
   hardcodes `cimis`.
   - Schema: `monitor_types: z.array(z.string()).nullable()`, required (the
     server always sends it). Its `string[]` passes straight to the bulk `type`
     option, since `MonitorTypeId` accepts any string.
3. **Valley-wide pesticide use.** `getPesticidesForPlace` accepts `null` for the
   place: no place params are sent and the server returns the whole valley's
   monthly and yearly use, same filters and counting, `place: null`.
   - Overloads: a `PlaceRef` returns `PesticidesForPlace & { place: Place }`
     (non-null), `null` returns `PesticidesForPlace & { place: null }`.
   - `pesticidesForPlaceSchema.place` becomes `placeSchema.nullable()`, so the
     exported `PesticidesForPlace.place` is `Place | null`. **Breaking** for
     code that types a value as `PesticidesForPlace` and reads `.place`.
   - `placeSearchParams` and the forecast, CalHeatScore, HMS and weather place
     functions are unchanged.

## Non-goals

- No client-side validation of type ids; the server's 400 is the check.
- No `type` on region bulk summaries (the server doesn't take it there).
- No change to `MonitorType` / `monitorTypeSchema` (the closed enum the monitor
  response schemas use).

## Constraints

- Needs a server running #350 (sjvair.com `develop` once merged). The beta
  publishes only after #350 merges.
- No fallbacks for older server responses (CLAUDE.md).

## Approaches

- `type` typing: closed `MonitorType` (rejected: callers would cast the meta's
  plain strings, and a new server type needs an SDK release); plain `string`
  (works, but loses editor hints); **hinted string** (chosen).
- Valley pesticides: **`null` with overloads** (chosen: one function, existing
  callers keep a non-null `place`); separate `getPesticidesForValley` (two
  functions for one endpoint, result type nullable anyway); plain
  `PlaceRef | null` without overloads (every caller null-checks).

## Tests

- Unit: `type` single and array produce repeated params; unset/empty sends
  nothing; `getPesticidesForPlace(null)` sends no place params; schema accepts
  `place: null`; overload types (`@ts-expect-error` / type assertions).
- Live: `type` narrows (every returned monitor has a named type; warn on empty);
  unknown type is a 400 `invalid_choice`; `type=cimis` on a weather entry type
  returns only CIMIS (warn on empty); valley pesticides validate with
  `place === null`; a half-given region is still a 400.
- Fixtures: re-capture `pesticides/place` (valley) and the catalog once the
  local stack runs #350.

## Docs

Module JSDoc examples, CLAUDE.md untouched, `api-urls.md`, CHANGELOG under 5.0.0
(Added: `type`, valley pesticides, catalog field; Breaking:
`PesticidesForPlace.place` nullable).

## Left to the builder

Exact export location of `MonitorTypeId` (likely `lib/monitors/types.ts`), test
file layout, fixture names.
