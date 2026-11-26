# Pesticide place filters, meta and search

## Intent

The data dashboard's pesticide layer (dashboard spec 3b) filters
`pesticides/place/` by chemical, commodity, product, category, narrowing, IARC
group, method and years, and labels the filters from `pesticides/meta/`. Its
pickers search `pesticides/search/`. sjvair.com PR #316 (merged into `develop`
2026-11-07, `a33ed4ba`) made those server changes. The SDK follows so its types
match what the server sends, and spec 3b can pin a release.

The server shapes below were checked against sjvair.com `origin/develop`
(`camp/api/v2/pesticides/endpoints.py`, `meta.py`, `serializers.py`,
`filters.py`) and the local stack on 2026-11-07.

## Decisions (the user's, 2026-11-07)

1. Place-filter 400s are surfaced by **a typed helper and nothing more**. The
   dashboard uses it to tell a typo (`invalid`) from a saved filter whose row is
   gone (`not_found`), and shows the latter as retired: a viewer-side message,
   nothing changes on the server.
2. This change also **closes older row-schema gaps**: `Chemical` gains
   `preferred_name` and `display_name` (on the server since sjvair.com
   `7ad7c995`, September 2026, never added to the SDK).
3. **`display_name` on commodity and product rows**, approved through the
   coordinator (data-dashboard-23). A separate sjvair.com PR into `develop`
   (session sjvair-com-48) adds it: commodity rows get `humanize_name(name)`,
   product rows a copy of `name`. **This SDK PR waits for that server PR to
   merge**, because the fields are required here. Take the final shape from that
   PR; if it differs from this spec, the PR wins and the spec is updated.

## Goals

### 1. `pesticides/place/` filters (`PesticidesForPlaceFilters`, `lib/pesticides/types.ts`)

The server's form (`PesticidePlaceForm`):

| filter          | SDK type                                              | server rule                                                 |
| --------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| `chemical`      | `string`                                              | our id (sqid, the list endpoints' `id`); CDPR codes refused |
| `commodity`     | `string`                                              | same                                                        |
| `product`       | `string` (new)                                        | same                                                        |
| `category`      | `string \| string[]`                                  | any of them (OR); repeated or comma-separated               |
| `narrow`        | `PesticideNarrow` (new)                               | `concern \| restricted \| fumigant \| aerial`               |
| `iarc_group`    | `IARCGroup`                                           | unchanged                                                   |
| `aerial_ground` | `AerialGroundFilter` (new) = `AerialGround \| "none"` | `none` selects records with no reported method              |
| `year__gte`     | `number`                                              | 1900 to 2100                                                |
| `year__lte`     | `number`                                              | 1900 to 2100                                                |

- Each filter gets a JSDoc line. Replace "The chemical, by its numeric id" with
  "by its id (the `id` the list endpoints return), not its CDPR code". Point
  `category` at `getPesticidesMeta()` for the valid keys.
- `category` stays `string`, not an enum: the server can add categories, and
  `getPesticidesMeta()` lists them. _(my call)_
- An array `category` goes out as repeated params (`?category=a&category=b`),
  the SDK's list style. The HTTP layer already appends array values;
  `getPesticidesForPlace` today stringifies every value, so it must pass arrays
  through instead. _(my call)_
- `PesticideNarrow` comes from a new Zod enum, `pesticideNarrowSchema`
  (`schemas/narrow.ts`).
- `AerialGroundFilter` is for filters only. `aerialGroundSchema` and
  `AerialGround` stay `A | F | G | O`, because records never contain `"none"`.
  _(my call)_
- `getPesticidesForPlace`'s `@param filters` doc mentions product and narrowing.

### 2. Place-filter error helper

A 400 from `pesticides/place/` is `{"errors": {field: [{message, code}]}}`. The
SDK already copies the body's `errors` to `error.cause.details`, and
`error.cause.result.status` holds the status.

Codes the server sends:

| field                                               | codes                               |
| --------------------------------------------------- | ----------------------------------- |
| `chemical`, `commodity`, `product`                  | `invalid`, `not_found`              |
| `category`, `narrow`, `iarc_group`, `aerial_ground` | `invalid`                           |
| `year__gte`, `year__lte`                            | `invalid`, `min_value`, `max_value` |

(`invalid` on a year is Django's code for a non-integer, which typed callers
can't send.)

New export, in `lib/pesticides/get_pesticides_for_place.ts`:

```ts
export type PesticidePlaceFilterErrors = {
  chemical?: "invalid" | "not_found";
  commodity?: "invalid" | "not_found";
  product?: "invalid" | "not_found";
  category?: "invalid";
  narrow?: "invalid";
  iarc_group?: "invalid";
  aerial_ground?: "invalid";
  year__gte?: "invalid" | "min_value" | "max_value";
  year__lte?: "invalid" | "min_value" | "max_value";
};

export function pesticidePlaceFilterErrors(
  error: unknown,
): PesticidePlaceFilterErrors | undefined;
```

- Returns the **first** code of each field the server named. Fields outside the
  table are ignored.
- Returns `undefined` unless `error` is an `Error` whose `cause.result.status`
  is 400 and whose `cause.details` is an object naming at least one field in the
  table. That covers a network failure, an abort reason, a 404 for an unknown
  place, and the place 400 `{"error": "..."}`, which has no `errors`.
- JSDoc example: catch from `getPesticidesForPlace`, check
  `errors?.chemical === "not_found"`.

### 3. `getPesticidesMeta()` (`pesticides/meta/`, new)

`lib/pesticides/get_pesticides_meta.ts`, using `jsonCall`, with a trailing
`options?: RequestOptions`. The server sends `{data: {...}}`, with
`Cache-Control: public, max-age=86400`.

```ts
type PesticidesMeta = {
  categories: Array<
    { key: string; label: string; description: string; in_use: boolean }
  >;
  iarc_groups: Array<{ key: IARCGroup; label: string; description: string }>;
  methods: Array<{ key: AerialGroundFilter; label: string }>;
  narrows: Array<{ key: PesticideNarrow; label: string; description: string }>;
  placeholder_chemicals: Array<{ id: string; name: string }>;
};
```

- Type derived from `pesticidesMetaSchema` (`schemas/pesticides_meta.ts`), with
  JSDoc on each field.
- `in_use` is false for the categories no import assigns.
- `methods` covers use records only, not spray-notice methods.
- The keys are permanent; labels may change.
- The lists are arrays, not records, so no `.asIter` wrapper.
- This is the catalog `meta_url` for `pesticide-use` and `pesticide-notices`.

### 4. `searchPesticides()` (`pesticides/search/`, newly wrapped)

`lib/pesticides/search_pesticides.ts`, modeled on `searchLocations`
(`lib/regions/search_locations.ts`): one params object that includes the request
options. _(my call: matches the existing search getter)_

```ts
export type PesticideSearchType = "chemical" | "product" | "commodity";

export type PesticideSearchParams<T extends PesticideSearchType> = {
  type: T;
  q: string;
  /** Default 10 on the server; capped at 25 there */
  limit?: number;
  /** Only names with reported use in this year, or "all" */
  year?: number | "all";
  /** Only names with reported use in this county (slug) */
  county?: string;
  /** Only names this narrowing keeps */
  narrow?: PesticideNarrow;
} & RequestOptions;

export async function searchPesticides<T extends PesticideSearchType>(
  params: PesticideSearchParams<T>,
): Promise<PesticideSearchResult<T>>;
// PesticideSearchResult<T> = { results: Array<PesticideSearchHit<T>>; more: boolean }
// PesticideSearchHit<"chemical"> = { id, name, detail, placeholder: boolean }
// PesticideSearchHit<"product" | "commodity"> = { id, name, detail }
```

- The server answers `{results, more}` at the top level (no `data` envelope), so
  use `apiCall`, not `jsonCall`.
- `q` is trimmed. Under 2 characters, return `{results: [], more: false}`
  without a request, as `searchLocations` does and as the server would answer.
- Unset params are not sent. Numbers are stringified.
- `name` is the entity's display name (a chemical's preferred name when it reads
  better). `detail` is a labeled CDPR code ("CDPR chem code 560"), or `""`. `id`
  is the same id `getPesticidesForPlace` takes.
- Schemas: `pesticideSearchHitSchema` and `chemicalSearchHitSchema` (the first
  plus `placeholder`). Types derive from them; the generic only picks between
  them. The builder chooses how to write the conditional type, as long as
  `results[0].placeholder` type-checks for `type: "chemical"` and not for the
  other two.
- One page only: that is the point of this getter. The list getters fetch every
  page (`products/?name=a` is 57,434 rows).
- The server's own 400s here (bad `type`, `limit` or `year`) are plain
  `{"error": "..."}`, with no field codes. Typed callers can't send most of
  them. No helper.
- The server's legacy `concern=1` is not exposed; `narrow=concern` replaces it.

### 5. Row schemas

- `chemicalSchema` gains:
  - `preferred_name: z.string()` (CompTox's name; `""` when none);
  - `display_name: z.string()` (what the explorer and search show);
  - `placeholder: z.boolean()` (CDPR's stand-ins for an unnamed ingredient,
    UNKNOWN and AI IS CONFIDENTIAL: real applications with no pounds).
- `productSchema` gains:
  - `cdpr_fumigant: z.boolean()` (CDPR's raw flag; `fumigant` is the corrected
    one), _(my call: the same kind of gap)_;
  - `display_name: z.string()` (pending the server PR, decision 3).
- `commoditySchema` gains `display_name: z.string()` (pending the server PR,
  decision 3).
- All required. Nested uses (details, use records, summaries, notices) pick them
  up through the shared schemas. Check each fixture or captured response that
  embeds these rows, and refresh any that no longer validate.

### 6. Getters that stay on CDPR codes

These hit `filters.py` filtersets, which still match CDPR codes:

- `getPesticideUseList`;
- `getRegionPesticideUse` (`PesticideUseFilter`);
- `getRegionPesticideSummary` (`PesticideSummaryFilter`);
- `getPesticideNoticeList`;
- `getRegionPesticideNotices` (`PesticideNoticeFilter`).

Types are unchanged. Each `chemical` / `commodity` / `product` JSDoc says "CDPR
code, not the `id`", and names `getPesticidesForPlace` as the getter that takes
ids, so nobody mixes them.

### 7. Catalog

`pesticide-use` gains an `applications` entry type, and both pesticide datasets'
`meta_url` becomes `/api/2.0/pesticides/meta/`. No type change: entry ids and
kinds are open strings. But:

- Refresh the `pesticide-use` and `pesticide-notices` entries in
  `lib/meta/fixtures/dataset_catalog.json` from the local stack.
- `lib/meta/mod_test.ts` asserts `pesticide-use` has `meta_url === ""`. That's
  no longer true. Assert the new value, and keep an empty-`meta_url` example on
  a dataset that still has one (`calenviroscreen` on the local stack).

### 8. Docs and bookkeeping

- `mod.ts` re-exports the two new files. Each new file gets the JSDoc block with
  `@example Usage` and `@module`.
- `api-urls.md`:
  - tick `pesticides/search/`;
  - add `pesticides/meta/`, ticked.
- `CHANGELOG.md` under 5.0.0:
  - **Breaking**:
    - `PesticidesForPlaceFilters.chemical` and `commodity` take our ids, not
      CDPR codes, and `chemical` is now a `string`;
    - the new row fields are required, so the SDK needs the matching server.
  - **Added**:
    - `product`, `narrow`, list `category` and `aerial_ground: "none"` on place
      filters;
    - `pesticidePlaceFilterErrors`;
    - `getPesticidesMeta`;
    - `searchPesticides`;
    - the new row fields.
- `DEFERRED.md`: nothing is deferred by this spec. If the builder defers
  anything, it gets an entry in the same change.

### 9. Catalog entry `aggregate` (pending a server PR)

Added 2026-11-07, approved by the user through the coordinator
(data-dashboard-23). The shape below is final, from sjvair-com-48:

- `aggregate` is a **top-level entry-type field**, next to `resolutions`, not
  inside `display`.
- Its type is `"sum" | "mean" | null`. It's always present; `null` means the
  values never roll up over time.
- `sum`: precipitation, eto, etr, pounds-applied, acres-treated, applications,
  spray-notice.
- `mean`: air-quality pollutants and particulates, the other weather types,
  TEMPO.
- `null`: winddirection, heat-score, aqi-forecast, ces-score, smoke-density,
  burn-status, fire-frp, facility-*, methane-emission-rate.

SDK work:

- Add `aggregate: z.enum(["sum", "mean"]).nullable()` to
  `datasetEntryTypeSchema` and its interface
  (`lib/meta/schemas/dataset_catalog.ts`). It's required (no fallback) and gets
  JSDoc.
- Recapture `lib/meta/fixtures/dataset_catalog.json` from the local stack.
- Same PR and beta as the rest. Do it after that server PR merges and the
  coordinator says the local stack serves it.

## Tests

Follow `lib/pesticides/mod_test.ts` and `lib/regions` (searchLocations):
stubbed-fetch tests for what is sent, captured fixtures for shapes, and
read-only live steps that skip when the endpoint is unavailable.

- **Place filters (stubbed):**
  - string ids are sent as given;
  - `category: ["a", "b"]` is sent as two `category` params;
  - `narrow`, `product` and `aerial_ground: "none"` are sent;
  - unset filters are not sent.
  - Update the existing step that sends `chemical: 253`.
- **Error helper (unit):**
  - returns first codes from a 400 with `details`;
  - ignores unknown fields;
  - returns `undefined` for a 404, a 400 without `details`, a non-`Error`, and
    an abort reason.
  - One stubbed end-to-end case: a 400 response through `getPesticidesForPlace`,
    then the helper.
- **Meta:**
  - a fixture captured from the local stack validates;
  - a live step validates and checks there are 10 categories;
  - the schema rejects a category without `in_use`.
- **Search:**
  - stubbed: params sent; `q` trimmed; a 1-character `q` makes no request;
    `year: "all"` is sent as `all`;
  - a chemical fixture with `placeholder` validates against the chemical schema;
  - a commodity fixture validates against the base schema;
  - live: `type=chemical&q=sulf` returns Sulfur first.
- **Rows:** live list and detail steps already validate against the schemas;
  they now cover the new fields.
- All live calls are GETs against the local stack. Nothing writes to the shared
  DB, and nothing touches production.

## Non-goals

- Wrapping `pesticides/sections/`, `townships/`, `notices/active/` and
  `notices/archive/` (still unchecked in `api-urls.md`).
- Moving the list and region getters to ids: the server keeps codes there.
- A field-error helper for any other endpoint.

## Constraints

- No fallbacks for older server responses: every new field is required.
- The PR goes into `release/5.0.0` and needs a server running sjvair.com
  `develop` with #316 and the `display_name` PR. Say so in the PR description.
- Publishing 5.0.0-beta.6 is a separate yes from the user.

## Left to the builder

- File layout within `lib/pesticides/schemas/`, and the Zod interface style
  (follow the neighbouring files).
- The exact conditional-type spelling for search hits.
- Fixture names, and which existing fixtures need refreshing.

## Sequencing _(my call)_

The commodity and product `display_name` server PR isn't on origin yet
(2026-11-07). Build and test everything else now, against develop. Put the
`commoditySchema` / `productSchema` `display_name` fields, and any fixtures that
embed commodity or product rows, in the plan's last task, done once that PR
merges and the local stack runs it. Until then, live steps that validate
commodity or product rows will fail, which is expected. The PR is opened only
after that task passes.
