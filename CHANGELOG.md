# Changelog

## 5.0.0 (unreleased; betas only)

5.0.0 goes live together with the sjvair.com release it wraps (sjvair.com
`develop`). It needs a server running that branch: the SDK keeps no fallbacks
for older server responses. It was called 4.8.0 through 4.8.0-beta.6; the call
changes below made it a major version.

Betas: **5.0.0-beta.1** (2026-11-04): everything below except "Planned" and the
entry-bounds change. **5.0.0-beta.2** (2026-11-04): adds the entry-bounds change
(bounds sent as given, `wholeDays` replaces `exact`). (#44) **5.0.0-beta.3**
(2026-11-04): adds the `monitors/meta/` change (`levels` removed,
`school_guidelines` added), the forecast `color` / `aqi_category` change (#45),
`label_plural`, the `searchRegionPlaces` rows and the `getMonitorsList` region
filter (#46). **5.0.0-beta.4** (2026-11-05): adds `name_template` and
`regionDisplayName` (#50), and leaves repo-only files out of the published
package (#48). **5.0.0-beta.5** (2026-11-05): adds `getPesticidesForPlace`
(#51), `getWeatherStationsForPlace` and the CIMIS weather entry types (#52),
`getSmokeForPlace` (#53), and `sum` on monitor summary rows (#54), for the Get
data layers. **5.0.0-beta.6** (2026-11-07): pesticide place filters by id (with
product, narrowing, several categories and method `none`),
`pesticidePlaceFilterErrors`, `getPesticidesMeta`, `searchPesticides`, the new
pesticide row fields, and catalog `aggregate` (#56, for sjvair.com #316, #317
and #318).

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

### Added

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
- The documents module (private; moves out of the public SDK before 5.0.0, see
  `DEFERRED.md`).
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

### Planned for 5.0.0

- The documents module moves out of the public SDK.
