# The Official SJVAir SDK

### Request options and defaults

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
