# Copilot Instructions for @sjvair/sdk

## Runtime & Tooling

This is a **Deno** project (v2.x), published to JSR as `@sjvair/sdk`.

```sh
# Run all tests (requires running SJVAir API at 127.0.0.1:8000 by default)
deno test --allow-net --allow-env

# Run a single test file
deno test --allow-net --allow-env lib/monitors/mod_test.ts

# Run tests against the live API
TEST_REMOTE=1 deno test --allow-net --allow-env

# Run tests without network (e.g. datetime only)
deno test lib/datetime/mod_test.ts
```

## Test Environment Setup

Copy `.env.template` to `.env` and fill in values. Tests read these env vars:

| Variable | Purpose |
|---|---|
| `TEST_PHONE` | Phone number for account tests |
| `TEST_MONITOR_ID` | Monitor ID for entry tests |
| `TEST_LATITUDE` | Latitude for closest-monitor tests |
| `TEST_LONGITUDE` | Longitude for closest-monitor tests |

Tests default to `http://127.0.0.1:8000` as origin; set `TEST_REMOTE=1` to use the live API (`https://www.sjvair.com`).

## Architecture

The SDK is a thin wrapper over the SJVAir REST API (`/api/2.0/...`). Modules are organized by resource domain under `lib/`:

```
lib/
  http/          # Core HTTP layer (origin, requests, errors)
  monitors/      # Monitor data, entries, metadata
  account/       # User auth, CRUD, subscriptions
  collocation_sites/
  hms/
    smoke/         # HMS Smoke GeoJSON data
  datetime/      # Date formatting utilities
```

### HTTP Layer Flow

`httpRequest` → `apiCall` → `jsonCall`

- **`httpRequest`**: raw fetch wrapper returning `APIRequestResponse<T>`
- **`apiCall`**: adds optional response handler callback
- **`jsonCall`**: unwraps the API's `{ data: T }` envelope automatically
- **`paginatedApiCall`**: fetches all pages concurrently and returns flattened array

To point requests at a different server (e.g. local dev):
```ts
import { setOrigin } from "@sjvair/sdk/http";
setOrigin("http://127.0.0.1:8000");
```

### Module Structure Convention

Each domain follows this layout:

```
lib/<domain>/
  mod.ts         # Re-exports the public API
  mod_test.ts    # Integration tests (Deno.test)
  types.ts       # TypeScript types (inferred from Zod schemas)
  schema.ts      # Zod schemas (or schemas/ subdirectory)
```

### Type Convention

All types are derived from Zod schemas using `zinfer` (an alias for `zod`'s `infer`):

```ts
import type { infer as zinfer } from "zod";
export type MonitorData = zinfer<typeof monitorDataSchema>;
```

Never define types manually when a Zod schema exists — derive them.

### Path Aliases

Defined in `deno.json` imports:

| Alias | Points to |
|---|---|
| `$http` | `./lib/http/mod.ts` |
| `$datetime` | `./lib/datetime/mod.ts` |
| `$testing` | `./lib/testing.ts` |

### Wrapper Classes with `.asIter`

Some API responses return objects keyed by string (e.g. `monitors/meta`). Wrapper classes (e.g. `MonitorsMeta`, `EntriesMeta`) expose an `asIter` property that converts these record values to arrays for easy iteration. Always add `.asIter` when wrapping a record-shaped API response.

### Zod Validation in Tests

Use `getSimpleValidationTest` from `$testing` to create validators that call `fail()` on schema mismatch:

```ts
import { getSimpleValidationTest } from "$testing";
const validateMonitorData = getSimpleValidationTest(monitorDataSchema);
validateMonitorData(await getMonitors()); // validates each item
```

## Key Conventions

- Test files are named `mod_test.ts` (not `*.test.ts` or `*.spec.ts`)
- Each module file should include a JSDoc block with `@example Usage` and `@module` tag
- All search params are typed as `Record<string, string>` — convert numbers/dates to strings before passing
- The `api-urls.md` file tracks which API endpoints are implemented; update it when adding new endpoints
- Publishing is triggered by pushing a `v*` git tag, which runs `deno publish` to JSR
