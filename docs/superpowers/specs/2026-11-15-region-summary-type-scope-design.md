# Whole-type scope on the bulk region summaries (SDK)

Date: 2026-11-15. The SDK side of sjvair.com's whole-type scope on the bulk
region summaries (branch `feature/region-summary-type-scope`, spec
`docs/superpowers/specs/2026-11-15-region-summary-type-scope-design.md` there).
Read that spec for the server behaviour. This one covers only what `@sjvair/sdk`
adds.

## Why

A map that fills every region of one type (every tract, every ZIP) can't list
each region as a repeated `region=<sqid>`: tracts pass Django's 1,000-field
limit and MTRS passes the URL limit. The server now takes the type itself:
`type=<Region.Type value>` on `/api/2.0/regions/<entry_type>/summaries/<res>/`
(every resolution) and `/api/2.0/regions/<entry_type>/summaries/daily/open/`. A
request takes exactly one of `type` (a single value) or `region`; both or
neither is a 400, as is `type=land_use` or an unknown type. `type` covers the
type's current regions that have a boundary, the set `/regions/geojson/` draws
(no retired regions, no old-vintage tracts). A type with nothing to show is an
empty 200. Paging, the response shape and cache headers are unchanged.

## Scope

On `release/5.0.0`, as **`5.0.0-beta.11`**. Per the no-fallbacks convention, a
`type` request needs a server running sjvair.com `develop` with that change.

### Types (`lib/regions/get_region_summaries_bulk.ts`)

- New `RegionSummaryBulkType = Exclude<RegionType, "land_use">`: the types the
  server accepts. `RegionType` is the SDK's existing union, inferred from
  `regionTypeSchema`. `place` was first excluded here too (the server has had no
  place regions since sjvair.com migration `regions/0009_delete_place_regions`);
  #64 then removed it from `RegionType` itself, so the exclusion was dropped.
- New `RegionSummaryBulkScope`, a union that takes exactly one of the two:

  ```ts
  | { region: string | Array<string>; type?: never }
  | { type: RegionSummaryBulkType; region?: never }
  ```

- `RegionSummaryBulkRequestConfig` becomes
  `{ entryType; start; end } & RegionSummaryBulkScope`, and
  `RegionSummaryBulkOpenRequestConfig` becomes
  `{ entryType } & RegionSummaryBulkScope` (written out rather than `Omit`,
  which would collapse the union). Both stay exported under the same names.

Neither and both are compile errors. Existing `{ region }` callers compile
unchanged. The two configs change from an interface and an `Omit` alias to type
aliases, so code that `extends` them as interfaces would need
`type X = RegionSummaryBulkRequestConfig & {...}` instead; nothing in the SDK
does.

### Requests

- `getBulkSummarySearchParams` sends `start`, `end`, and either `region` or
  `type`, never both. The open-days fetcher sends the same scope param.
- The six resolution fetchers, `getRegionSummariesBulkDailyOpen`,
  `mergeRegionSummaryBulkPages` and `mergeBulkOpenDays` are otherwise unchanged:
  the response and paging are the same for both scopes.

### Docs

- Module and function doc comments: exactly one of `region` or `type` is
  required, with a `type` example.
- `api-urls.md`: the bulk region lines note `?region=` / `?type=`.
- `CHANGELOG.md`: an Added line for `5.0.0-beta.11`, saying existing `region`
  calls are unchanged.

## Tests (fetch stubbed, no network)

- Each resolution fetcher with `type` hits its URL with `type=tract`, `start`,
  `end`, and no `region`.
- A `type` request whose rows span two pages merges the split region.
- `getRegionSummariesBulkDailyOpen` with `type` sends `type` and no `region`.
- A `region` request still sends repeated `region` and no `type`.
- Type-level checks (`// @ts-expect-error`): neither, both, `land_use` and
  `place` don't compile.

## Not in scope

- The monitor bulk endpoints (unchanged on the server).
- Client-side checks for the 400s: the server rejects them, and the types
  already rule out neither, both and `land_use`.
