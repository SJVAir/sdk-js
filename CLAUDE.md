# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Runtime & Tooling

This is a **Deno v2.x** project published to JSR as `@sjvair/sdk`. There is no
build step — TypeScript is run directly.

```sh
# Run all tests (requires a local SJVAir API at 127.0.0.1:8000)
deno test --allow-net --allow-env

# Run a single test file
deno test --allow-net --allow-env lib/monitors/mod_test.ts

# Run tests against the live API
TEST_REMOTE=1 deno test --allow-net --allow-env

# Run tests that don't need network (e.g. datetime)
deno test lib/datetime/mod_test.ts
```

## Test Environment

Copy `.env.template` to `.env` and fill in:

| Variable          | Purpose                             |
| ----------------- | ----------------------------------- |
| `TEST_PHONE`      | Phone number for account tests      |
| `TEST_MONITOR_ID` | Monitor ID for entry tests          |
| `TEST_LATITUDE`   | Latitude for closest-monitor tests  |
| `TEST_LONGITUDE`  | Longitude for closest-monitor tests |

Tests default to `http://127.0.0.1:8000`; set `TEST_REMOTE=1` to use
`https://www.sjvair.com`.

## Architecture

The SDK is a thin wrapper over the SJVAir REST API (`/api/2.0/...`). Each domain
module under `lib/` follows a consistent layout:

```
lib/<domain>/
  mod.ts         # Re-exports the public API
  mod_test.ts    # Integration tests (Deno.test)
  types.ts       # TypeScript types derived from Zod schemas
  schema.ts      # Zod schemas (or schemas/ subdirectory)
```

### HTTP Layer

`httpRequest` → `apiCall` → `jsonCall`

- **`httpRequest`**: raw fetch wrapper returning `APIRequestResponse<T>`
- **`apiCall`**: adds an optional response handler callback
- **`jsonCall`**: unwraps the API's `{ data: T }` envelope automatically
- **`paginatedApiCall`**: fetches all pages concurrently and returns a flattened
  array

To point requests at a different server:

```ts
import { setOrigin } from "@sjvair/sdk/http";
setOrigin("http://127.0.0.1:8000");
```

### Path Aliases (deno.json imports)

| Alias       | Points to               |
| ----------- | ----------------------- |
| `$http`     | `./lib/http/mod.ts`     |
| `$datetime` | `./lib/datetime/mod.ts` |
| `$testing`  | `./lib/testing.ts`      |

## Key Conventions

- **Types are derived from Zod schemas** using `zinfer`
  (`import type { infer as zinfer } from "zod"`). Never define types manually
  when a Zod schema exists.
- **All search params** are typed as `Record<string, string | string[]>` —
  convert numbers/dates to strings before passing. An array value is sent as
  repeated params (e.g. `?region=a&region=b`).
- **Test files** are named `mod_test.ts` (not `*.test.ts` or `*.spec.ts`).
- **Validation in tests**: use `getSimpleValidationTest` from `$testing` to
  validate schema conformance and call `fail()` on mismatch.
- **Wrapper classes with `.asIter`**: when an API response is a record keyed by
  string (e.g. `monitors/meta`), expose an `asIter` property that converts
  record values to arrays for easy iteration.
- **Each module file** should include a JSDoc block with `@example Usage` and
  `@module` tag.
- **`api-urls.md`** tracks which API endpoints are implemented — update it when
  adding new endpoints.

## Publishing

Pushing a `v*` git tag triggers the GitHub Actions workflow which runs
`deno publish` to JSR. Update `"version"` in `deno.json` before tagging.
