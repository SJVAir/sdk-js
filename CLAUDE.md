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

#### Request options and defaults

Every function that fetches takes a trailing `options?: RequestOptions`
(`getMonitors` names it `requestOptions`):

- **`signal`**: an `AbortSignal` that cancels the request. It wins over
  `init.signal`. An aborted call rejects with the signal's reason, unchanged:
  `abort()` gives an `AbortError` `DOMException`, `abort("why")` rejects with
  `"why"`.
- **`init`**: extra `fetch` init fields (`headers`, `credentials`, ...), applied
  over everything else.

```ts
import { getMonitors } from "@sjvair/sdk/monitors";

const controller = new AbortController();
const pending = getMonitors("pm25", undefined, { signal: controller.signal });
controller.abort();

try {
  await pending;
} catch (e) {
  // `e` is the signal's reason: an AbortError DOMException for `abort()`.
}
```

`setRequestDefaults` applies to every request (`getRequestDefaults` and
`resetRequestDefaults` read and clear it; each call replaces the previous
defaults):

```ts
import { setRequestDefaults } from "@sjvair/sdk/http";

setRequestDefaults({
  // A value, or a function called on every request.
  headers: () => ({ "X-Client": "my-app" }),
  credentials: "include",
  // Optional: { cookieName, headerName } (defaults `csrftoken` and
  // `X-CSRFToken`), or false to turn the CSRF header off.
  csrf: { cookieName: "csrftoken", headerName: "X-CSRFToken" },
});
```

**Precedence**, lowest to highest: built-in CSRF header, global default headers,
the function's own headers (such as `Authorization`), then the caller's
`options.init.headers`. `credentials` and other `init` fields follow the same
order.

**CSRF header**: `X-CSRFToken` is sent only when the method is POST, PUT, PATCH,
or DELETE; `document.cookie` exists; the `csrftoken` cookie has a value; and the
request URL's origin equals `location.origin`. The cookie is read fresh on every
request. The cookie `csrftoken` and header `X-CSRFToken` are the defaults; both
are configurable through `csrf`, and `csrf: false` disables the header.

**Authentication**: account functions take an optional `apiToken`. With one they
send `Authorization: Token ...`; without one (or with an empty one) they rely on
the session cookie, and a missing sign-in surfaces as the server's 401/403.

On a failed request, `error.cause.init` holds the merged `init`, with `headers`
as a `Headers` instance and the values of `Authorization`, the CSRF header, and
the request `body` replaced by `"[redacted]"`.

### Path Aliases (deno.json imports)

| Alias       | Points to               |
| ----------- | ----------------------- |
| `$http`     | `./lib/http/mod.ts`     |
| `$datetime` | `./lib/datetime/mod.ts` |
| `$testing`  | `./lib/testing.ts`      |

## Key Conventions

- **Types are derived from Zod schemas** using `zinfer`
  (`import type { infer as zinfer } from "zod"`). Never define types manually
  when a Zod schema exists:

  ```ts
  import type { infer as zinfer } from "zod";
  export type MonitorData = zinfer<typeof monitorDataSchema>;
  ```

- **All search params** are typed as `Record<string, string | string[]>` —
  convert numbers/dates to strings before passing. An array value is sent as
  repeated params (e.g. `?region=a&region=b`).
- **Test files** are named `mod_test.ts` (not `*.test.ts` or `*.spec.ts`).
- **Validation in tests**: use `getSimpleValidationTest` from `$testing` to
  create validators that call `fail()` on schema mismatch:

  ```ts
  import { getSimpleValidationTest } from "$testing";
  const validateMonitorData = getSimpleValidationTest(monitorDataSchema);
  validateMonitorData(await getMonitorsList()); // validates each item
  ```

- **Wrapper classes with `.asIter`**: when an API response is a record keyed by
  string (e.g. `monitors/meta`), expose an `asIter` property that converts
  record values to arrays for easy iteration. Wrapper classes like
  `MonitorsMeta`/`EntriesMeta` follow this pattern — always add `.asIter` when
  wrapping a record-shaped API response.
- **Each module file** should include a JSDoc block with `@example Usage` and
  `@module` tag.
- **`api-urls.md`** tracks which API endpoints are implemented — update it when
  adding new endpoints.

## Publishing

Pushing a `v*` git tag triggers the GitHub Actions workflow which runs
`deno publish` to JSR. Update `"version"` in `deno.json` before tagging.

**Standing restriction:** NEVER push a `v*` tag, run `deno publish`, or
otherwise trigger this workflow without the user's explicit permission for that
specific publish — every single time. Approval for one publish does not carry
forward to the next, even later in the same session or as the natural next step
of a task already in progress (e.g. bumping the version and then "finishing" by
publishing it). Always stop and ask first, and wait for an explicit yes.
