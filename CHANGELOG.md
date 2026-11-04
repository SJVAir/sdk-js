# Changelog

## 5.0.0 (unreleased; betas only)

5.0.0 goes live together with the sjvair.com release it wraps (sjvair.com
`develop`). It needs a server running that branch: the SDK keeps no fallbacks
for older server responses. It was called 4.8.0 through 4.8.0-beta.6; the call
changes below made it a major version.

Betas: **5.0.0-beta.1** (2026-11-04): everything below except "Planned" and the
entry-bounds change. **5.0.0-beta.2** (2026-11-04): adds the entry-bounds change
(bounds sent as given, `wholeDays` replaces `exact`). (#44)

### Breaking

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
- Metadata fields the server now always sends are required in the schemas, e.g.
  `getRegionsMeta` needs `location_types` and `buffers`. (#39, #40)

### Added

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
- HMS smoke and fire by day or date range (`{ date }` or `{ start, end }`),
  region and smoke density. (#40)
- `@sjvair/sdk/calenviroscreen`: tract scores by region (`getCalEnviroScreen`)
  and for one tract (`getCalEnviroScreenTract`), for CES 4.0 and 5.0. (#40)
- The documents module (private; moves out of the public SDK before 5.0.0, see
  `DEFERRED.md`).

### Changed

- Entry date ranges send zone-aware bounds and snap days in Pacific time.
- By-code lookups return only the codes asked for.

### Planned for 5.0.0

- The documents module moves out of the public SDK.
