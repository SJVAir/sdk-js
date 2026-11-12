# Changelog

## 5.0.0 (unreleased; betas only)

5.0.0 goes live together with the sjvair.com release it wraps (sjvair.com
`develop`). It needs a server running that branch: the SDK keeps no fallbacks
for older server responses. It was called 4.8.0 through 4.8.0-beta.6; the call
changes below made it a major version.

Betas: **5.0.0-beta.1** (2026-11-04): everything below except the documents
removal and the entry-bounds change. **5.0.0-beta.2** (2026-11-04): adds the
entry-bounds change (bounds sent as given, `wholeDays` replaces `exact`). (#44)
**5.0.0-beta.3** (2026-11-04): adds the `monitors/meta/` change (`levels`
removed, `school_guidelines` added), the forecast `color` / `aqi_category`
change (#45), `label_plural`, the `searchRegionPlaces` rows and the
`getMonitorsList` region filter (#46). **5.0.0-beta.4** (2026-11-05): adds
`name_template` and `regionDisplayName` (#50), and leaves repo-only files out of
the published package (#48). **5.0.0-beta.5** (2026-11-05): adds
`getPesticidesForPlace` (#51), `getWeatherStationsForPlace` and the CIMIS
weather entry types (#52), `getSmokeForPlace` (#53), and `sum` on monitor
summary rows (#54), for the Get data layers. **5.0.0-beta.6** (2026-11-07):
pesticide place filters by id (with product, narrowing, several categories and
method `none`), `pesticidePlaceFilterErrors`, `getPesticidesMeta`,
`searchPesticides`, the new pesticide row fields, and catalog `aggregate` (#56,
for sjvair.com #316, #317 and #318). **5.0.0-beta.7** (2026-11-08):
`getMonitorAlertCurrent` and the `monitors/meta/` `alerts` field (#58, for
sjvair.com #319). **5.0.0-beta.8** (2026-11-09): scale averaging fields, daily
figures and `is_final` on summary rows, the open-day fetchers and merges (#59,
for sjvair.com #320 and #321).

### Breaking

- `monitors/meta/` entries no longer have `levels`. `EntriesMeta.levels`,
  `EntriesMeta.asIter`, `SJVAirEntryLevel` and `sjvairEntryLevelMetaSchema` are
  removed. Use `scale` instead: a legacy level's `name` is the scale level's
  `key`. (#45)
- `getHMSSmoke(options)` and `getHMSFire(options)` are now
  `getHMSSmoke(query?, options?)` and `getHMSFire(query?, options?)`. Pass
  `undefined` for the query to keep today's data:
  `getHMSSmoke(undefined, {
  signal })`. Plain-JS callers of the old form lose
  their request options without an error. (#40)
- `getRegionDetails(regionId, options)` is now
  `getRegionDetails(regionId, query?, options?)`. (#40)
- Entry date ranges (`getMonitorEntries`, `getMonitorEntriesCSVUrl`,
  `getValidDateRange`) send the bounds you give unchanged; they no longer widen
  two bounds within five minutes of each other to whole Pacific days. Pass
  `wholeDays: true` to round a range out to whole Pacific days. `exact`
  (5.0.0-beta.1 and earlier betas) is removed.
- `searchRegionPlaces` returns `RegionPlaceMatch[]` instead of `RegionData[]`:
  rows have no boundary geometry (only `bbox`; use `getRegionDetails`) and carry
  their containing `county` (`null` on county rows). (#46, sjvair.com #308)
- Metadata fields the server now always sends are required in the schemas, e.g.
  `getRegionsMeta` needs `location_types` and `buffers`. (#39, #40)
- Pesticide rows and catalog entry types have new required fields: chemicals
  `preferred_name`, `display_name` and `placeholder`; products `display_name`
  and `cdpr_fumigant`; commodities `display_name`; catalog entry types
  `aggregate`. Code that builds these objects by hand (mocks, fixtures) must add
  them. (#56)

- `@sjvair/sdk/documents` is removed. It shipped only in prereleases
  (4.8.0-beta.2 to 5.0.0-beta.8); the client moved into the data-dashboard repo
  (decided 2026-11-11). See "What belongs in the SDK" in `CLAUDE.md`. (#60)

### Added

- `getPesticideLocations` features gain `source` (`"cde-public"`,
  `"cde-private"` or `"cdss-ccl"`) and `external_id` (the location's permanent
  code within its source) in `properties`, as on `Location`. Required.
  (sjvair.com #331)
- Scales gain `averaging_hours` (`24`, `1`, `8` or `null`), `daily_statistic`
  (`"mean_24h"`, `"max_1h"`, `"max_8h"` or `null`: the daily summary row field
  that judges a day against the scale) and `daily_statistic_label` (its
  translated display text, or `null`). Required on every scale. New
  `DailyStatistic` type. (sjvair.com #320)
- Summary rows (monitor and region, single and bulk, every resolution) gain
  `max_1h`, `max_8h` and `mean_24h` (`number | null`; set only on daily rows,
  and only the one the scale's `daily_statistic` names) and `is_final` (the row
  can't change anymore). Required. `row[scale.daily_statistic]` types as
  `number | null`. (sjvair.com #320, #321)
- Open days: `getMonitorSummariesDailyOpen`, `getRegionSummariesDailyOpen`,
  `getMonitorSummariesBulkDailyOpen` and `getRegionSummariesBulkDailyOpen` fetch
  today's daily rows so far, plus yesterday's until its nightly row exists
  (`.../daily/open/`; always `is_final: false`). `mergeOpenDays` and
  `mergeBulkOpenDays` (new `@sjvair/sdk/open-days`, also exported from
  `monitors` and `regions`) merge them into stored daily rows: the stored row
  wins on a shared day. Read `is_final: false` on today as "so far", on an
  earlier day as "not final yet", and a missing row as "no data". (sjvair.com
  #321)
- `getMonitorAlertCurrent(monitorId)`: the result of the server's latest
  10-minute alert run for a monitor, keyed by entry type
  (`monitors/<id>/alerts/current/`): the 60-minute average (or an hourly feed's
  latest reading), its level, the window, the reading counts, the same
  evaluation an hour earlier (`previous`), and `evaluated_at`. `status` is `ok`,
  `insufficient`, `no_data` or `pending`; every other field is `null` when there
  is no stored result (`pending`, or `no_data` for an inactive monitor). A
  missing key means the pair isn't evaluated. `previous` carries `status`,
  `value`, `level` and `latest_timestamp`; equal current and previous
  `latest_timestamp`s mean both come from the same reading (a lagging hourly
  feed), so there is no trend.
- `monitors/meta/` entries gain `alerts`: the alert run's `window`,
  `min_coverage`, `stage`, `processor` and `expected_interval` override, or
  `null` when the pair isn't evaluated.
- `sum` on monitor summary rows (and bulk rows): the total of the period's
  values, e.g. precipitation, ETo and ETr. Region summary rows do not carry it.
- `getSmokeForPlace`: the smoke over a region or monitor by day, with the
  heaviest density and the coverage of each (`hms/smoke/place/`).
- `getWeatherStationsForPlace`: the weather stations inside a region, or the
  nearest ones, for a region or monitor (`monitors/weather/place/`).
- `MonitorEntryType` includes the CIMIS weather types (`dewpoint`,
  `soiltemperature`, `windspeed`, `winddirection`, `precipitation`,
  `solarradiation`, `netradiation`, `vaporpressure`, `eto`, `etr`).
- Catalog entry types gain `aggregate`: how their values roll up over time,
  `"sum"`, `"mean"`, or `null` when they never roll up. Required. (#56,
  sjvair.com #318)
- Metadata: the dataset catalog and available pollutants (`getDatasetCatalog`),
  `getCoverage`, scales, the region hierarchy, and the HMS, forecast and
  CalHeatScore metas.
- Regions and locations by official code (`getRegionsByCode`,
  `getLocationsByCode`), any number of codes (sent 100 per request). (#40)
- `getRegionsGeoJSON`, with code lists of any length (#40), and
  `getRegionDetails` `buffer`, with the choices in `getRegionsMeta().buffers`.
  (#40)
- Location name search (`searchLocations`) and `getPesticideLocations`.
- Point and monitor modes for `lookupRegionPlace`, and a `dataset` option for
  `getMonitorsList`.
- Forecasts and CalHeatScore, including by place.
- `getPesticidesForPlace`: monthly and yearly pesticide use for a region or
  monitor, with chemical, commodity, product, category, narrowing, IARC group,
  application method and year filters. Needs a server running sjvair.com #310
  and #316. **Changed since 5.0.0-beta.5:** `chemical` and `commodity` take our
  ids (the list endpoints' `id`, a `string`), not CDPR codes, which the server
  now refuses. New: `product`, `narrow`, `category` as a list (any of them), and
  `aerial_ground: "none"` (no reported method). `pesticidePlaceFilterErrors`
  reads the codes of a rejected filter (`invalid`, or `not_found` for an id
  whose row is gone). (#56)
- `getPesticidesMeta`: labels and descriptions for the pesticide filters
  (`pesticides/meta/`), the catalog `meta_url` of both pesticide datasets. (#56,
  sjvair.com #316)
- `searchPesticides`: one page of chemical, product or commodity matches by name
  (`pesticides/search/`), for pickers. (#56, sjvair.com #316)
- Chemical rows gain `preferred_name`, `display_name` and `placeholder`; product
  rows gain `display_name` and `cdpr_fumigant`; commodity rows gain
  `display_name` (the name in sentence case). All required. (#56, sjvair.com
  #316, #317 and earlier)
- HMS smoke and fire by day or date range (`{ date }` or `{ start, end }`),
  region and smoke density. (#40)
- `@sjvair/sdk/calenviroscreen`: tract scores by region (`getCalEnviroScreen`)
  and for one tract (`getCalEnviroScreenTract`), for CES 4.0 and 5.0. (#40)
- `monitors/meta/` entries gain `school_guidelines`
  (`EntriesMeta.school_guidelines`, types `SchoolGuidelines` and
  `SchoolActivity`): outdoor activity guidelines for schools, `null` except for
  `pm25`. (#45)
- `getMonitorsList({ region })`: the monitors in one or more regions (by region
  id; several give the union). (#46, sjvair.com #308)
- Region types in `regions/meta/` gain `label_plural`, the type's plural label
  in Title Case (e.g. "Counties"). (#46, sjvair.com #307)
- Region types in `regions/meta/` gain `name_template`, how to show a region of
  that type (e.g. "ZIP {name}"; `null` shows the plain name), and
  `regionDisplayName(region, meta)` fills it in, falling back to `name`. (#50,
  sjvair.com #309)

### Changed

- Entry date ranges send zone-aware bounds and snap days in Pacific time.
- By-code lookups return only the codes asked for.
- Forecast `color` is the AQI scale level's color for `aqi_value` (it was a
  blended gradient), and `aqi_category` is that level's label. The types are
  unchanged. (#45)
- The published package leaves out repo-only files: `docs/` (specs and plans),
  `CLAUDE.md`, `DEFERRED.md`, `api-urls.md`, `.env.template` and `.github/`.
  5.0.0-beta.1 to beta.3 include them.
