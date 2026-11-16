# Pesticide Map API wrappers

2026-11-16. SDK side of data-dashboard Release 1, step 5, spec 5: spray notices,
then pesticide use by section and township, on the dashboard's Map widget.

Server spec: sjvair.com
`docs/superpowers/specs/2026-11-16-pesticide-map-api-design.md` (branch
`feature/pesticide-notices-day`). It is the source of truth for every response
shape below. Where this document and the server spec disagree, the server spec
wins; tell the user.

## Why

The dashboard's Map shows spray notices for a chosen Pacific day, and shades
pesticide use by township (zoomed out) and by section (zoomed in). The dashboard
stores no generated English and hardcodes no labels, colours or links. The
server now serves the notices by day, the shading classes, the explainer text,
the badges, the colour ramp and the years. The SDK has to wrap them with typed,
validated schemas so the dashboard can call them.

## Goals

- **beta.12 (server PR 1, notices):** `getActivePesticideNotices` for
  `pesticides/notices/active/`, the `notes`, `badges` and `links` fields on
  `getPesticidesMeta`, and the loosened location `source` and `type`.
- **beta.13 (server PR 2, use):** `getPesticideSections`,
  `getPesticideSectionDetails` and `getPesticideTownships` for
  `pesticides/sections/`, `sections/<id>/` and `townships/`, and the `years`,
  `ramp` and `notes.shades_valley` fields on meta.

## Non-goals

- `pesticides/notices/archive/`. The user deferred it on 2026-11-16: nothing
  calls it, and the Map shows past days through `notices/active/?date=`. Revisit
  when an app needs past notices by year or month. The coordinator records the
  deferral in data-dashboard `DEFERRED.md`. `api-urls.md` keeps it unchecked,
  with that reason.
- Per-field error codes for these endpoints. The server answers a bad parameter
  with `{"error": "<message>"}`, one string, so there is no counterpart of
  `pesticidePlaceFilterErrors`.
- Changing `getPesticideNoticeList` (`pesticides/notice/`), which serves a
  different notice shape.

## Anti-goals

- A schema that is loose "in case" an older server lacks a field (CLAUDE.md: no
  fallbacks). Fields are optional only where the current server omits them:
  `past` without `date`, `classes` without `classes=1`, `*_prev` without
  `compare`.
- Changing any existing function's behaviour or signature, apart from the
  location type widening below.

## Constraints

- Branch from and PR into `release/5.0.0`. PR 1 is
  `feature/pesticide-map-notices`. PR 2 branches from `release/5.0.0` after PR 1
  merges, or stacks on PR 1.
- A beta is published only after the server PR it wraps has merged into
  sjvair.com `develop`, and only with the user's explicit yes, each time. Until
  then the work is built against the server spec, using fixtures. Server PR 1
  isn't written yet (its branch has only the `stats.py` day-window helpers), so
  PR 1's fixtures start out built by hand from the server spec. They are
  replaced with captured responses once the server code exists.
- _(My call.)_ Each SDK PR opens once its fixture tests pass, and merges only
  after its server PR has merged into `develop` and the integration tests pass
  against the local stack running it. The merge still needs the user's yes.
  `release/5.0.0` tracks `develop`, so merging earlier would leave the release
  branch requiring fields the server doesn't send yet.
- Integration tests run against the shared local stack, which runs `develop`.
  Ask the coordinator when the merged server code is live. Never use
  `TEST_REMOTE=1`, and never run the account test.
- No PR CI: run `deno test`, `deno lint`, `deno fmt --check` and `deno check`
  locally before each PR.
- Types come from Zod schemas. Each module has a JSDoc block with
  `@example Usage` and `@module`. Update `api-urls.md` and `CHANGELOG.md` in the
  PR.

## Approaches (delivery)

1. **One spec and plan, two PRs, one per beta (picked by the user).** It follows
   the server's split, and the server spec already has both PRs' shapes.
2. Two spec and plan pairs. Paperwork without a benefit, since the shapes are
   final.
3. One PR and one beta. The notices would wait for server PR 2 for no reason.

## Approaches (location `source`/`type`)

The user picked **known values plus any string**:
`"cde-public" | "cde-private" | "cdss-ccl" | (string & {})`, and likewise for
`type`. Rejected: a plain `string` (loses the documented values and
autocomplete), and mapping unknown values to `"other"` (loses the real value).

## PR 1 / beta.12

### `getActivePesticideNotices(params?)`

`GET pesticides/notices/active/`. It returns the bare FeatureCollection (no
`{data}` envelope), fetched the way `getPesticideLocations` does with `apiCall`.
Not paginated: the server caps the response at 2000 matches and answers more
with a 400 ("bbox too large; zoom in").

The parameters, all optional, in one object with the `RequestOptions` `signal`
and `init`:

| Param           | Type                              | Sent as                                                                                  |
| --------------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `bbox`          | `[west, south, east, north]`      | `bbox=w,s,e,n`                                                                           |
| `region`        | `string` (sqid)                   | `region=`                                                                                |
| `buffer`        | `0 \| 1 \| 3 \| 5`                | `buffer=` (with `region`)                                                                |
| `date`          | `string`, `YYYY-MM-DD`            | `date=`. A Pacific date: notices whose 4-day window covers that day                      |
| `chemical_id`   | `string`                          | `chemical_id=`. A chemical id (sqid), as `getPesticidesForPlace`'s `chemical` takes      |
| `product_id`    | `string`                          | `product_id=`. A product id (sqid)                                                       |
| `county`        | `string`                          | `county=` (a county slug)                                                                |
| `narrow`        | `PesticideNarrow`                 | `narrow=`                                                                                |
| `aerial_ground` | `AerialGroundFilter`              | `aerial_ground=`. `G`, `A`, `F`, `O` or `none`; the server maps it to SprayDays' wording |
| `category`      | `string \| ReadonlyArray<string>` | repeated `category=`, as on `getPesticidesForPlace`                                      |
| `iarc_group`    | `IARCGroup`                       | `iarc_group=`                                                                            |

`bbox` and `region` can be combined (the server applies both). This is unlike
`getPesticideLocations`, whose area is one of several forms. Per the server
code: `treated_units` and `application_method` may be empty strings, and
`county`, `section`, `section_id` and `geometry` may be null.

**Response** (`ActivePesticideNoticeCollection`):

```
{ type: "FeatureCollection", as_of: string (ISO), features: [{
    type: "Feature", id: string,
    geometry: GeoJSON Point | null,
    properties: {
      id: string,
      scheduled_application: string (ISO), scheduled_end: string (ISO),
      county: string | null, application_method: string,
      treated_amount: number | null, treated_units: string,
      section: string | null, section_id: string | null,
      products: [{ id, name }],
      chemicals: [{ id, name, display_name, is_of_concern: boolean }],
      past?: boolean,
    } }] }
```

Check every field and nullability against the server code
(`camp/api/v2/pesticides/sections.py`, `ActiveNoticeListBase.get`) and a
captured response, and save the response as a fixture.

**`past` typing.** It is optional in the schema. An overload makes it `boolean`
(required) when `date` is given. The exact type mechanics (overloads, or a
generic over the params) are the builder's call. The result has to be that
`getActivePesticideNotices({ date })` features have `past: boolean`, and calls
without `date` have `past?: boolean`, or no `past` at all.

### `getPesticidesMeta()` additions

- `notes: Record<string, { key: string; title: string; summary: string; detail: string | null; source_url: string }>`.
  The keys are open-ended: the server serves every note in its YAML. The
  documentation names the ones the server guarantees (`noi_meaning`, `pur_lag`,
  `badges`, `prop65`, `carb_tac`, `iarc_1`, `iarc_2a`, `iarc_2b`, `iarc_3`,
  `california_restricted`). They are not typed as required keys.
- `badges: Array<{ key: string; label: string; note: string }>`, in display
  order. `note` is a key into `notes`. The current keys are `prop65`,
  `carb_tac`, `iarc_1`, `iarc_2a`, `iarc_2b`, `iarc_3` and
  `california_restricted`, and badge keys are permanent. `key` is typed as known
  values plus any string, the same pattern as the location `source`.
- `links: { spraydays_signup: string }`.

All three are required (the server always sends them once PR 1 is live). Update
the meta fixture from a captured response.

### Location `source` and `type`

In `lib/regions/schemas/location.ts`, `locationSourceSchema` and
`locationTypeSchema` accept the known values or any other string. The types are
known values plus `(string & {})`. This also widens three inputs
(`searchLocations` `type`, `getLocationsByCode` `source` and
`getPesticideLocations` `type`), which is fine. It covers every place that
reuses them: regions locations, `searchLocations`, `getLocationsByCode`, retired
`replaced_by`, `getPesticideLocations` features, and regions meta
`location_types`.

Watch out for regions meta: `location_types` is
`z.record(locationTypeSchema, …)`. With an enum key, Zod 4 requires every enum
key to be present. Once the key schema accepts any string, that exhaustiveness
check goes away. That is acceptable, because the record is keyed by whatever
types the server has. If keeping the known keys required turns out to matter,
tell the user before choosing.

This is a breaking type change, listed under the CHANGELOG's **Breaking**
section: code that assigns these fields into the old closed union stops
compiling.

### Tests (PR 1)

- Fixture tests, with no network, in the style of
  `get_pesticide_locations_test.ts`: a captured `notices/active/?date=` response
  and an updated meta response validate against the schemas. Use `stubFetch` to
  check that the URL each parameter produces matches the table above (repeated
  `category`, `bbox` joined with commas, numbers as strings, unset parameters
  not sent).
- Location schemas: an unknown `source` and `type` parse and come back
  unchanged, and known values still parse.
- An integration test against the local stack, once server PR 1 is live there:
  `getActivePesticideNotices({ date })` features validate and each has a boolean
  `past`, and meta validates.
- Type-level check: `past` is a `boolean` with `date` (a compile-time assertion
  or `@ts-expect-error`, checked by `deno check`).

## PR 2 / beta.13

Build PR 2 only after confirming the final shapes with the coordinator (server
PR 2 may refine them).

### Shared use filters

`UseFilters`, for sections and townships:

| Param           | Type                              | Notes                                                   |
| --------------- | --------------------------------- | ------------------------------------------------------- |
| `year`          | `number \| "all"`                 | the server defaults to the latest year                  |
| `month`         | `number` (1-12)                   | each month is ranked alone in `classes`                 |
| `compare`       | `number`                          | adds the `*_prev` properties                            |
| `chemical_id`   | `string`                          | a chemical id (sqid)                                    |
| `product_id`    | `string`                          | a product id (sqid)                                     |
| `commodity_id`  | `string`                          | a commodity id (sqid)                                   |
| `county`        | `string`                          | slug; narrows both geometry and numbers                 |
| `aerial_ground` | `AerialGroundFilter`              | `G`, `A`, `F`, `O` or `none`                            |
| `narrow`        | `PesticideNarrow`                 |                                                         |
| `category`      | `string \| ReadonlyArray<string>` | repeated                                                |
| `iarc_group`    | `IARCGroup`                       |                                                         |
| `classes`       | `true`                            | sends `classes=1`                                       |
| `geometry`      | `false`                           | sends `geometry=0`; features then have `geometry: null` |

### `getPesticideSections(params)`

`GET pesticides/sections/`. An area is required, in one of three forms: `bbox`;
`lat`, `lng` and optional `radius` (`1 | 3 | 5`, from the server's
`RADIUS_CHOICES`, default 1); or `region` with an optional `buffer`. Per the
server code: `region` can be combined with `bbox` or with `lat`/`lng`, and
`bbox` wins over `lat`/`lng`. So the type is (`bbox` | `lat`/`lng`/`radius`),
optionally plus `region`/`buffer`, or `region`/`buffer` alone. The parameters
also take `UseFilters` and `RequestOptions`. More than 2500 sections is a 400.

The response is a FeatureCollection with `year: number | "all" | null`. `null`
comes from a database with no pesticide years loaded (the user decided
2026-11-16 to allow it). The same applies to section details' `year`. Each
feature's properties are
`{ id, mtrs, county: string | null, lbs_chemical,
lbs_product, acres_treated, applications }`
(numbers), plus `lbs_chemical_prev`, `lbs_product_prev`, `acres_treated_prev`
and `applications_prev` with `compare`. `applications` is an integer and the
other totals are floats. All of them default to 0, never null. The geometry is a
GeoJSON Polygon/MultiPolygon, or `null` with `geometry: false`. With
`classes: true`, the collection has
`classes: { lbs_chemical, acres_treated, applications }`, each
`{ breaks: number[], min: number | null }`. Typed required by overload, like
`past`. The classes rank every section (or township) in the valley for `year`,
`month` and the value filters; the area and `county` never change them (the
server drops `county` before ranking; confirmed against server PR 2's code,
2026-11-16).

### `getPesticideTownships(params?)`

`GET pesticides/townships/`. The area is optional (`bbox`, or `region` with
`buffer`; no `lat`/`lng`). It takes the same `UseFilters`, and the response is
the same collection shape, but each feature's properties are
`{ id, name,
sections: number, ...totals }`. `sections` is an integer count, and
`id` equals `name`. `id` and `name` are the PLSS township designation (e.g.
`MDM-T14S-R20E`), which the server documents as permanent. Say so in the JSDoc.

### `getPesticideSectionDetails(id, filters?)`

`GET pesticides/sections/<id>/`. A bare object (no `{data}`), fetched with
`apiCall`. `months` has 12 zero-filled rows, `years` rows are
`{year,
lbs_chemical, lbs_product, acres_treated, applications}`, and `geometry`
and `county` may be null. A bad `year` falls back to the latest year rather than
returning a 400. The filters are
`{ year?: number | "all"; narrow?: PesticideNarrow }`. The response is
`{ id, mtrs, county, year, geometry, years: [{year, ...totals}],
months: [{month, lbs_chemical, acres_treated, applications}], top_chemicals:
[{id, name, display_name, lbs, is_of_concern, badges: string[]}],
top_products: [{id, name, display_name, lbs}], top_commodities: [...] }`.
Check each against the server. The `badges` elements are badge keys
(`PesticideBadgeKey`, known plus string).

### Meta additions (PR 2)

- `years: number[]`, newest first.
- `ramp: { colors: string[]; no_data: string }`.
- `notes.shades_valley` exists. No schema change, because `notes` is open.
  Document it as one of the guaranteed notes once PR 2 is live.

### Tests (PR 2)

The same pattern as PR 1: fixtures captured from the server branch or the local
stack, URL-building tests for each area form and filter, type checks for
`classes`, and integration tests once server PR 2 is live locally.

## Release notes

- CHANGELOG under 5.0.0: beta.12 lists `getActivePesticideNotices`, the meta
  `notes`, `badges` and `links`, and the breaking location type widening, and
  says it needs sjvair.com `develop` with server PR 1. beta.13 lists the section
  and township functions and the meta `years` and `ramp`, and needs server PR 2.
- `api-urls.md`: check off `notices/active/`, `sections/`, `sections/<id>/` and
  `townships/` as each lands. Keep `notices/archive/` unchecked, with "deferred
  2026-11-16: no caller".
- Each PR description says which sjvair.com PR the beta needs.

## Filter values (decided 2026-11-16)

The server added `place/`'s filter values to the map endpoints in PR 1 (server
spec, "The charts' filter values on the map endpoints"):

- `chemical_id`, `product_id` and `commodity_id` take ids (sqids).
- `aerial_ground` takes `G|A|F|O|none`.
- The CDPR-code `chemical`, `product`, `commodity` and `method` params stay on
  the server.
- Sending both forms of one filter is a 400.
- `commodity_id` on notices is a 400 ("notices don't record a commodity").
- On notices, `chemical_id`, `category` and `iarc_group` must all hold on the
  same chemical.

**The user picked option 1:** the SDK exposes only the id forms and
`aerial_ground`, under the server's names. Notices take `chemical_id`,
`product_id` and `aerial_ground`, with no commodity filter. Sections and
townships also take `commodity_id`. The CDPR-code forms and `method` aren't
exposed, because nothing calls them. Adding them later would not break anything;
removing them later would.

Rejected:

- Exposing both forms, with types that forbid sending both: more surface and
  tests, for no caller.
- `getPesticidesForPlace`'s names (`chemical` meaning an id): the SDK name would
  no longer match the server's.

The dashboard maps its `chemical` filter to `chemical_id` itself.

`getPesticidesMeta()` also gains `notice_filters: string[]` (in PR 1). It lists
the value filters the notice endpoints accept, today `chemical_id`,
`product_id`, `category`, `iarc_group`, `narrow` and `aerial_ground`. The type
is open-ended strings, so the server can add more.

## Left to the builder

The type mechanics for `past` and `classes`, file and schema names (following
`lib/pesticides/` conventions), test layout, and how to capture the fixtures.
Every "check this against the server" item above resolves against the server
code or a captured response. If the server's response contradicts this document,
stop and tell the user.
