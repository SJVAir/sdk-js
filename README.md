# The Official SJVAir SDK

### Request options and defaults

Every function that fetches takes a trailing `options?: RequestOptions`
(`getMonitors` names it `requestOptions`):

- **`signal`**: an `AbortSignal` that cancels the request. It wins over
  `init.signal`. Aborts reject with the original `AbortError`, never wrapped.
- **`init`**: extra `fetch` init fields (`headers`, `credentials`, ...), applied
  over everything else.

```ts
import { getMonitors } from "@sjvair/sdk/monitors";

const controller = new AbortController();
const monitors = getMonitors("pm25", undefined, { signal: controller.signal });
controller.abort(); // `monitors` rejects with an AbortError
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
  // Optional: { cookieName, headerName }, or false to turn the CSRF header off.
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
request. Set `csrf: false` to disable it.

**Authentication**: account functions take an optional `apiToken`. With one they
send `Authorization: Token ...`; without one (or with an empty one) they rely on
the session cookie, and a missing sign-in surfaces as the server's 401/403.

Error `cause.init` keeps the merged `init`, with the values of `Authorization`
and the CSRF header replaced by `"[redacted]"`.
