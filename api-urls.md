# Current API URLs

## Accounts

User account management

- [x] `/api/2.0/account/`
  - [x] `GET`
  - [x] `DELETE`
  - [x] `PATCH`
- [x] `/api/2.0/account/alerts/`
- [x] `/api/2.0/account/login/`
- [x] `/api/2.0/account/password-reset/` <- Automated testing needs to be figured out
- [x] `/api/2.0/account/password-reset/<uidb64>/<token>/` <- Automated testing needs to be figured out
- [x] `/api/2.0/account/password/`
- [x] `/api/2.0/account/phone/`
- [x] `/api/2.0/account/phone/verify/` <- Automated testing needs to be figured out
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
- [ ] `/api/2.0/hms-smoke/<smoke_id>/`
- [x] `/api/2.0/hms-smoke/ongoing/`

## Monitors and Entries

Air monitors, current and historical data, monitor subscriptions, and entry archives

- [x] `/api/2.0/monitors/`
- [x] `/api/2.0/monitors/<entry_type>/closest/`
- [x] `/api/2.0/monitors/<entry_type>/current/`
- [x] `/api/2.0/monitors/<monitor_id>/`
- [x] `/api/2.0/monitors/<monitor_id>/alerts/subscribe/`
- [x] `/api/2.0/monitors/<monitor_id>/alerts/unsubscribe/`
- [ ] `/api/2.0/monitors/<monitor_id>/archive/`
- [ ] `/api/2.0/monitors/<monitor_id>/archive/<int:year>/<int:month>/`
- [ ] `/api/2.0/monitors/<monitor_id>/entries/`
- [x] `/api/2.0/monitors/<monitor_id>/entries/<entry_type>/`
- [x] `/api/2.0/monitors/<monitor_id>/entries/<entry_type>/csv/`
- [ ] `/api/2.0/monitors/<monitor_id>/entries/export/`
- [x] `/api/2.0/monitors/meta/`

## Tasks

Task status

- [ ] `/api/2.0/task/<task_id>/`

## Time

Current time as a Unix time stamp

- [ ] `/api/2.0/time/`
