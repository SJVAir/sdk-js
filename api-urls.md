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

## HMS Smoke

HMS Smoke GeoJSON

- [x] `/api/2.0/hms-smoke/`
- [x] `/api/2.0/hms-smoke/<smoke_id>/`
- [x] `/api/2.0/hms-smoke/ongoing/`

## Monitors and Entries

Air monitors, current and historical data, monitor subscriptions, and entry
archives

- [x] `/api/2.0/monitors/`
- [x] `/api/2.0/monitors/<entry_type>/at/`
- [x] `/api/2.0/monitors/<entry_type>/closest/`
- [x] `/api/2.0/monitors/<entry_type>/current/`
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

## Regions

Region and place lookups, boundaries, and region-level entry summaries

- [x] `/api/2.0/regions/`
- [x] `/api/2.0/regions/places/search/`
- [x] `/api/2.0/regions/places/lookup/`
- [x] `/api/2.0/regions/<region_id>/`
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

- [ ] `/api/2.0/task/<task_id>/`

## Time

Current time as a Unix time stamp

- [ ] `/api/2.0/time/`
