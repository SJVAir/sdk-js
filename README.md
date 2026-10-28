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

### Documents

`@sjvair/sdk/documents` wraps the private `/api/2.0/documents/` endpoints: the
signed-in user's saved dashboards (list, read, poll for changes, save,
permanently delete), share links and shared reads, snapshots, a copy's credit,
and the public display name. Responses use the API's `snake_case` keys and are
checked against Zod schemas, except the contents of a document `body` and of a
change, which the dashboard validates itself.

The calls rely on the session cookie (there is no `apiToken` parameter); outside
a browser, pass `Cookie` and `X-CSRFToken` through `options.init`. Any error
response throws a `DocumentRefusal` with the server's refusal `code`, the HTTP
`status`, and the refusal's `data`. `REFUSAL_CODES` lists every code, including
the fallbacks for responses without one (non-JSON and empty bodies included,
such as a proxy's HTML 503): `unauthorized` (a 401, such as signed out),
`forbidden` (a 403, such as a failed CSRF check), `not_found` (a 404), and
`unknown`. A successful response the SDK can't use (not JSON, or not matching
the schema) throws a `DocumentResponseError` instead.

```ts
import {
  getDocumentChanges,
  isDocumentRefusal,
  saveDocument,
  staleBaseDataSchema,
} from "@sjvair/sdk/documents";

try {
  const { version } = await saveDocument("abc", {
    kind: "dashboard",
    schema_version: 1,
    name: null,
    body: { widgets: [] },
    deleted_at: null,
    copied_from: null,
    base_version: 3,
    changes: [{ schema_version: 1, change: { op: "add" } }],
    account_id: "<the signed-in account id>",
    build_id: "<git sha>",
    snapshot: null,
  });
} catch (error) {
  if (isDocumentRefusal(error, "stale_base")) {
    const { changes, document } = staleBaseDataSchema.parse(error.data);
    // Rebase on `changes`, or on `document` when `changes` is null.
  } else throw error;
}

const result = await getDocumentChanges("abc", 4);
if ("document" in result) {
  // Newer than version 4: result.changes (or null) and result.document.
}
```

`listDocuments({ since })` takes the previous list's `cursor`; it lists
documents updated since then, including ones only shared or unshared (their
`version` is unchanged). The dashboards backup
(`GET /api/2.0/documents/export/`) is a file download meant for a browser link,
so it has no SDK function.
