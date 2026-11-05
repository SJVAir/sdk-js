# Current API URLs

## Accounts

User account management

- [x] `/api/2.0/account/`
  - [x] `GET`
  - [x] `DELETE`
  - [x] `PATCH`
- [x] `/api/2.0/account/alerts/`
- [x] `/api/2.0/account/login/`
- [x] `/api/2.0/account/password-reset/` <- Automated testing needs to be
      figured out
- [x] `/api/2.0/account/password-reset/<uidb64>/<token>/` <- Automated testing
      needs to be figured out
- [x] `/api/2.0/account/password/`
- [x] `/api/2.0/account/phone/`
- [x] `/api/2.0/account/phone/verify/` <- Automated testing needs to be figured
      out
- [x] `/api/2.0/account/register/`

## Alerts

Air quality alerts

- [x] `/api/2.0/alerts/subscriptions/`

## Collocations

Collocation site info

- [x] `/api/2.0/calibrations/`

## Documents

Signed-in users' saved dashboards (private API, used with the session cookie)

- [x] `/api/2.0/documents/`
- [x] `/api/2.0/documents/?since=<iso_datetime>`
- [x] `/api/2.0/documents/<id>/`
  - [x] `GET`
  - [x] `PUT`
  - [x] `DELETE`
- [x] `/api/2.0/documents/<id>/changes/?since=<version>`
- [x] `/api/2.0/documents/<id>/credit/`
- [x] `/api/2.0/documents/<id>/share/`
  - [x] `POST`
  - [x] `DELETE`
- [x] `/api/2.0/documents/<id>/snapshots/`
  - [x] `GET`
  - [x] `POST`
- [x] `/api/2.0/documents/<id>/snapshots/<snapshot_id>/`
- [x] `/api/2.0/documents/profile/`
  - [x] `GET`
  - [x] `PUT`
- [x] `/api/2.0/documents/shared/<token>/`
- [x] `/api/2.0/documents/shared/<token>/changes/?since=<version>`
- [ ] `/api/2.0/documents/export/` <- A file download (the dashboards backup)
      for a browser link, not an SDK call

## HMS Smoke and Fire

HMS smoke and fire GeoJSON, and the smoke-density and fire-FRP scale metadata

- [x] `/api/2.0/hms/meta/`
- [x] `/api/2.0/hms/smoke/` (`?date=`, or `?date__gte=&date__lte=`;
      `?region_id=`, `?density=`)
- [x] `/api/2.0/hms/smoke/<smoke_id>/`
- [x] `/api/2.0/hms/fire/` (`?date=`, or `?date__gte=&date__lte=`;
      `?region_id=`)
- [x] `/api/2.0/hms/fire/<fire_id>/`

## CalHeatScore

Heat scores by ZIP code, and by place

- [x] `/api/2.0/calheatscore/`
- [x] `/api/2.0/calheatscore/meta/`
- [x] `/api/2.0/calheatscore/place/`
- [ ] `/api/2.0/calheatscore/<zipcode>/` <- Covered by the `zipcode` filter on
      the list

## CalEnviroScreen

Tract scores by version, for the tracts in a region or one tract

- [x] `/api/2.0/calenviroscreen/4.0/` (`?region_id=&within_mode=`, `?year=`)
- [x] `/api/2.0/calenviroscreen/4.0/<tract>/` (`?year=`)
- [x] `/api/2.0/calenviroscreen/5.0/` (`?region_id=&within_mode=`)
- [x] `/api/2.0/calenviroscreen/5.0/<tract>/`

## Emissions

- [ ] `/api/2.0/emissions/` (and everything under it: facilities, dairies,
      wells, schools, methane, places, districts, areas, years) <- Not wrapped
      yet: no client uses it; comes with the widget or map layer that needs it

## Forecasts

Air quality forecasts, and by place

- [x] `/api/2.0/forecasts/`
- [x] `/api/2.0/forecasts/meta/`
- [x] `/api/2.0/forecasts/place/`
- [ ] `/api/2.0/forecasts/<forecast_id>/` <- Not wrapped yet: forecasts are read
      by list or by place, never by id

## Monitors and Entries

Air monitors, current and historical data, monitor subscriptions, and entry
archives

- [x] `/api/2.0/monitors/` (`?dataset=`, `?region=`)
- [x] `/api/2.0/monitors/<entry_type>/at/`
- [x] `/api/2.0/monitors/<entry_type>/closest/`
- [x] `/api/2.0/monitors/<entry_type>/current/`
- [x] `/api/2.0/monitors/<entry_type>/summaries/hourly/`
- [x] `/api/2.0/monitors/<entry_type>/summaries/daily/`
- [x] `/api/2.0/monitors/<entry_type>/summaries/monthly/`
- [x] `/api/2.0/monitors/<entry_type>/summaries/quarterly/`
- [x] `/api/2.0/monitors/<entry_type>/summaries/seasonal/`
- [x] `/api/2.0/monitors/<entry_type>/summaries/yearly/`
- [x] `/api/2.0/monitors/<monitor_id>/`
- [x] `/api/2.0/monitors/<monitor_id>/alerts/subscribe/`
- [x] `/api/2.0/monitors/<monitor_id>/alerts/unsubscribe/`
- [x] `/api/2.0/monitors/<monitor_id>/archive/`
- [x] `/api/2.0/monitors/<monitor_id>/archive/<int:year>/<int:month>/`
- [ ] `/api/2.0/monitors/<monitor_id>/entries/` <-- Excluded from SDK
- [x] `/api/2.0/monitors/<monitor_id>/entries/<entry_type>/`
- [x] `/api/2.0/monitors/<monitor_id>/entries/<entry_type>/csv/`
- [ ] `/api/2.0/monitors/<monitor_id>/entries/export/` <-- Excluded from SDK
      (requires login)
- [x] `/api/2.0/monitors/<monitor_id>/entries/export/csv/`
- [x] `/api/2.0/monitors/<monitor_id>/entries/export/json/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/hourly/<int:year>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/hourly/<int:year>/<int:month>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/hourly/<int:year>/<int:month>/<int:day>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/daily/<int:year>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/daily/<int:year>/<int:month>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/monthly/<int:year>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/quarterly/<int:year>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/seasonal/<int:year>/`
- [x] `/api/2.0/monitors/<monitor_id>/summaries/<entry_type>/yearly/`
- [x] `/api/2.0/monitors/meta/`
- [x] `/api/2.0/monitors/weather/place/`

## Meta

The catalog of datasets the API serves

- [x] `/api/2.0/meta/datasets/`
- [x] `/api/2.0/meta/coverage/`

## Pesticides

Pesticide chemicals, commodities, products, use records, application notices,
and region-level use summaries

- [x] `/api/2.0/pesticides/chemicals/`
- [x] `/api/2.0/pesticides/chemicals/<chemical_id>/`
- [x] `/api/2.0/pesticides/commodities/`
- [x] `/api/2.0/pesticides/commodities/<commodity_id>/`
- [x] `/api/2.0/pesticides/notice/`
- [x] `/api/2.0/pesticides/notice/<notice_id>/`
- [x] `/api/2.0/pesticides/products/`
- [x] `/api/2.0/pesticides/products/<product_id>/`
- [x] `/api/2.0/pesticides/region/<region_id>/notice/`
- [x] `/api/2.0/pesticides/region/<region_id>/summary/`
- [x] `/api/2.0/pesticides/region/<region_id>/use/`
- [x] `/api/2.0/pesticides/use/`
- [x] `/api/2.0/pesticides/use/<use_id>/`
- [x] `/api/2.0/pesticides/locations/`
- [x] `/api/2.0/pesticides/place/`
- [ ] `/api/2.0/pesticides/notices/active/` <- Not wrapped yet: comes with the
      pesticide metadata and widgets spec
- [ ] `/api/2.0/pesticides/notices/archive/` <- Same
- [ ] `/api/2.0/pesticides/search/` <- Same
- [ ] `/api/2.0/pesticides/sections/` <- Same
- [ ] `/api/2.0/pesticides/sections/<section_id>/` <- Same
- [ ] `/api/2.0/pesticides/townships/` <- Same

## Regions

Region and place lookups, boundaries, and region-level entry summaries

- [x] `/api/2.0/regions/`
- [x] `/api/2.0/regions/?type=<type>&external_id=<code>,<code>`
- [x] `/api/2.0/regions/?type=<type>&within=<region_id>&within_mode=overlaps`
- [x] `/api/2.0/regions/geojson/`
- [x] `/api/2.0/regions/meta/` (includes the allowed `buffers`)
- [x] `/api/2.0/regions/locations/?source=<source>&external_id=<code>,<code>`
- [x] `/api/2.0/regions/locations/search/?q=<name>&type=<type>,<type>&region_type=<type>&region=<code>`
- [x] `/api/2.0/regions/places/search/`
- [x] `/api/2.0/regions/places/lookup/` (name `?q=`; monitor `?monitor=`; point
      via POST)
- [x] `/api/2.0/regions/<entry_type>/summaries/hourly/`
- [x] `/api/2.0/regions/<entry_type>/summaries/daily/`
- [x] `/api/2.0/regions/<entry_type>/summaries/monthly/`
- [x] `/api/2.0/regions/<entry_type>/summaries/quarterly/`
- [x] `/api/2.0/regions/<entry_type>/summaries/seasonal/`
- [x] `/api/2.0/regions/<entry_type>/summaries/yearly/`
- [x] `/api/2.0/regions/<region_id>/` (`?buffer=`)
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/hourly/<int:year>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/hourly/<int:year>/<int:month>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/hourly/<int:year>/<int:month>/<int:day>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/daily/<int:year>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/daily/<int:year>/<int:month>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/monthly/<int:year>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/quarterly/<int:year>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/seasonal/<int:year>/`
- [x] `/api/2.0/regions/<region_id>/summaries/<entry_type>/yearly/`

## Tasks

Task status

- [ ] `/api/2.0/task/<task_id>/` <- Not wrapped yet: no SDK call starts a
      background task

## TEMPO

- [ ] `/api/2.0/tempo/` (and everything under it: granules, point, region) <-
      Not wrapped yet: comes with the TEMPO map layer (it needs a raster plugin
      first)

## Time

Current time as a Unix time stamp

- [ ] `/api/2.0/time/` <- Not wrapped: clients use their own clock
