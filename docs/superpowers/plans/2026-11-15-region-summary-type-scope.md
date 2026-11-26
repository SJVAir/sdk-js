# Whole-type scope on the bulk region summaries: plan

Spec: `docs/superpowers/specs/2026-11-15-region-summary-type-scope-design.md`.
Branch `feature/region-summary-type-scope` from `origin/release/5.0.0`, PR into
`release/5.0.0`.

## Task 1: failing tests

In `lib/regions/get_region_summaries_bulk_test.ts`, with `stubFetch` from
`lib/http/fetch_stub_test_utils.ts` and `setOrigin("http://127.0.0.1:8000")`:

- For each of hourly, daily, monthly, quarterly, seasonal and yearly, a
  `type: "tract"` config calls `/api/2.0/regions/pm25/summaries/<res>/` with
  `type=tract`, `start`, `end`, and no `region`.
- Daily with `type` over two pages (`page`, `pages`, `has_next_page`), the last
  region of page 1 continuing on page 2: one merged entry with both rows.
- `getRegionSummariesBulkDailyOpen({ entryType, type: "zipcode" })` sends
  `type=zipcode` and no `region`.
- `region: ["a", "b"]` still sends `region=a&region=b` and no `type`.
- `@ts-expect-error` on neither, both, and `type: "land_use"` (checked by
  `deno check` / `deno test`).

Run `deno test lib/regions/get_region_summaries_bulk_test.ts`; expect failures
(type errors and the missing `type` param).

## Task 2: implementation

In `lib/regions/get_region_summaries_bulk.ts`: add `RegionSummaryBulkType` and
`RegionSummaryBulkScope`, redefine the two configs as in the spec, add a
`getBulkScopeSearchParams(scope)` returning `{ type }` or `{ region }`, used by
`getBulkSummarySearchParams` and the open-days fetcher. Update the module and
function doc comments. Run the test file; expect it to pass.

## Task 3: docs and checks

`CHANGELOG.md` (Added, beta.11), `api-urls.md`. Then `deno fmt --check`,
`deno lint`, `deno check` on the module, the offline test files
(`get_region_summaries_bulk_test.ts`, `lib/open_days_fetch_test.ts`), and
`deno publish --dry-run`.

## Task 4: PR

Push, open a PR into `release/5.0.0` naming the server requirement. Release
(`deno.json` version, `chore: Release 5.0.0-beta.11`, tag) only after the
sjvair.com PR merges into `develop` and the user says yes to each step.
