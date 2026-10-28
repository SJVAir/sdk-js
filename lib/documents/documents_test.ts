import {
  assert,
  assertEquals,
  assertFalse,
  assertInstanceOf,
  assertRejects,
} from "@std/assert";
import { setOrigin } from "$http";
import { setEnvironmentForTests } from "../http/environment.ts";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import {
  createShareLink,
  deleteDocument,
  DocumentRefusal,
  DocumentResponseError,
  getDocument,
  getDocumentChanges,
  getDocumentCredit,
  getDocumentProfile,
  getSharedDocument,
  getSharedDocumentChanges,
  getSnapshot,
  isDocumentRefusal,
  listDocuments,
  listSnapshots,
  REFUSAL_CODES,
  revokeShareLink,
  saveDocument,
  type SaveDocumentForm,
  staleBaseDataSchema,
  updateDocumentProfile,
} from "./mod.ts";

const ORIGIN = "https://www.sjvair.com";
const COOKIE = "sessionid=s; csrftoken=tok";

type Call = { url: URL; init: RequestInit };

/** Runs `fn` with fetch stubbed and a same-origin browser page with a CSRF cookie. */
async function withStub(
  respond: Parameters<typeof stubFetch>[0],
  fn: (calls: Array<Call>) => Promise<void>,
) {
  const stub = stubFetch(respond);
  setEnvironmentForTests({ cookie: COOKIE, origin: ORIGIN });
  setOrigin(ORIGIN);
  try {
    await fn(stub.calls);
  } finally {
    setEnvironmentForTests(null);
    stub.restore();
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const noContent = () => new Response(null, { status: 204 });

function header(call: Call, name: string) {
  return new Headers(call.init.headers).get(name);
}

function method(call: Call) {
  return (call.init.method ?? "GET").toUpperCase();
}

const DOCUMENT = {
  id: "abc",
  kind: "dashboard",
  name: "Fresno",
  schema_version: 1,
  version: 4,
  body: { widgets: [] },
  copied_from: null,
  deleted_at: null,
  created_at: "2026-10-28T12:00:00Z",
  updated_at: "2026-10-28T13:00:00Z",
  visibility: "private" as const,
  share_token: null,
};

const { body: _body, ...META_FIELDS } = DOCUMENT;
const META = { ...META_FIELDS, size: 14 };

const ENTRY = { version: 4, schema_version: 1, change: { op: "add" } };

const SHARED = {
  id: "abc",
  kind: "dashboard",
  name: "Fresno",
  schema_version: 1,
  version: 4,
  body: { widgets: [] },
  updated_at: "2026-10-28T13:00:00Z",
  display_name: null,
};

const FORM: SaveDocumentForm = {
  kind: "dashboard",
  schema_version: 1,
  name: null,
  body: { widgets: [] },
  deleted_at: null,
  copied_from: null,
  base_version: 3,
  changes: [{ schema_version: 1, change: { op: "add" } }],
  account_id: "u1",
  build_id: "deadbeef",
  snapshot: null,
};

function refusal(code: string, status: number, data?: unknown) {
  const body: Record<string, unknown> = {
    errors: { detail: [{ message: `refused: ${code}`, code }] },
  };
  if (data !== undefined) body.data = data;
  return () => json(body, status);
}

// --- Requests --------------------------------------------------------------

Deno.test("listDocuments: GET documents/, without since", async () => {
  const data = {
    documents: [META],
    purged: ["old"],
    cursor: "2026-10-28T12:59:50Z",
  };
  await withStub(() => jsonResponse({ data }), async (calls) => {
    assertEquals(await listDocuments(), data);
    assertEquals(method(calls[0]), "GET");
    assertEquals(calls[0].url.href, `${ORIGIN}/api/2.0/documents/`);
  });
});

Deno.test("listDocuments: since is URL-encoded, + included", async () => {
  const data = { documents: [], purged: [], cursor: "c" };
  await withStub(() => jsonResponse({ data }), async (calls) => {
    await listDocuments({ since: "2026-10-28T12:00:00.5+00:00" });
    assertEquals(
      calls[0].url.search,
      "?since=2026-10-28T12%3A00%3A00.5%2B00%3A00",
    );
    assertEquals(
      calls[0].url.searchParams.get("since"),
      "2026-10-28T12:00:00.5+00:00",
    );
  });
});

Deno.test("getDocument: GET documents/<id>/", async () => {
  await withStub(() => jsonResponse({ data: DOCUMENT }), async (calls) => {
    assertEquals(await getDocument("abc"), DOCUMENT);
    assertEquals(method(calls[0]), "GET");
    assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/");
    assertEquals(header(calls[0], "x-csrftoken"), null);
  });
});

Deno.test("getDocumentChanges: unchanged answers only the version", async () => {
  await withStub(
    () => jsonResponse({ data: { version: 4 } }),
    async (calls) => {
      assertEquals(await getDocumentChanges("abc", 4), { version: 4 });
      assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/changes/");
      assertEquals(calls[0].url.searchParams.get("since"), "4");
    },
  );
});

Deno.test("getDocumentChanges: changed answers the changes and the document", async () => {
  const data = { version: 4, changes: [ENTRY], document: DOCUMENT };
  await withStub(() => jsonResponse({ data }), async () => {
    const result = await getDocumentChanges("abc", 3);
    assert("document" in result);
    assertEquals(result, data);
  });
});

Deno.test("getDocumentChanges: changes may be null", async () => {
  const data = { version: 4, changes: null, document: DOCUMENT };
  await withStub(() => jsonResponse({ data }), async () => {
    assertEquals(await getDocumentChanges("abc", 9), data);
  });
});

Deno.test("getDocumentChanges: a broken document is not read as unchanged", async () => {
  const data = { version: 4, changes: null, document: { id: "abc" } };
  await withStub(() => jsonResponse({ data }), async () => {
    const error = await assertRejects(() => getDocumentChanges("abc", 3));
    assertFalse(isDocumentRefusal(error));
  });
});

Deno.test("saveDocument: PUT documents/<id>/ with the form as JSON and CSRF", async () => {
  const data = { version: 4, updated_at: "2026-10-28T13:00:00Z" };
  await withStub(() => jsonResponse({ data }), async (calls) => {
    assertEquals(await saveDocument("abc", FORM), data);
    assertEquals(method(calls[0]), "PUT");
    assertEquals(calls[0].url.href, `${ORIGIN}/api/2.0/documents/abc/`);
    assertEquals(JSON.parse(calls[0].init.body as string), FORM);
    assertEquals(header(calls[0], "content-type"), "application/json");
    assertEquals(header(calls[0], "x-csrftoken"), "tok");
  });
});

Deno.test("deleteDocument: DELETE documents/<id>/ with no body, 204", async () => {
  await withStub(noContent, async (calls) => {
    assertEquals(await deleteDocument("abc"), undefined);
    assertEquals(method(calls[0]), "DELETE");
    assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/");
    assertEquals(calls[0].init.body, undefined);
    assertEquals(header(calls[0], "content-type"), null);
    assertEquals(header(calls[0], "x-csrftoken"), "tok");
  });
});

Deno.test("createShareLink: POST documents/<id>/share/ with no body", async () => {
  await withStub(
    () => jsonResponse({ data: { share_token: "t0k" } }),
    async (calls) => {
      assertEquals(await createShareLink("abc"), { share_token: "t0k" });
      assertEquals(method(calls[0]), "POST");
      assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/share/");
      assertEquals(calls[0].init.body, undefined);
      assertEquals(header(calls[0], "content-type"), null);
      assertEquals(header(calls[0], "x-csrftoken"), "tok");
    },
  );
});

Deno.test("revokeShareLink: DELETE documents/<id>/share/ with no body, 204", async () => {
  await withStub(noContent, async (calls) => {
    assertEquals(await revokeShareLink("abc"), undefined);
    assertEquals(method(calls[0]), "DELETE");
    assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/share/");
    assertEquals(calls[0].init.body, undefined);
    assertEquals(header(calls[0], "x-csrftoken"), "tok");
  });
});

Deno.test("listSnapshots and getSnapshot: GET documents/<id>/snapshots/", async () => {
  const meta = {
    id: 7,
    version: 3,
    schema_version: 1,
    reason: "conflict",
    created_at: "2026-10-28T12:00:00Z",
  };
  const snapshot = {
    id: 7,
    version: 3,
    schema_version: 1,
    name: null,
    body: { widgets: [] },
    created_at: "2026-10-28T12:00:00Z",
  };
  await withStub(
    (_url, _init, call) =>
      jsonResponse({ data: call === 0 ? [meta] : snapshot }),
    async (calls) => {
      assertEquals(await listSnapshots("abc"), [meta]);
      assertEquals(await getSnapshot("abc", 7), snapshot);
      assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/snapshots/");
      assertEquals(
        calls[1].url.pathname,
        "/api/2.0/documents/abc/snapshots/7/",
      );
      assertEquals(calls.map(method), ["GET", "GET"]);
    },
  );
});

Deno.test("getDocumentCredit: GET documents/<id>/credit/", async () => {
  const data = { name: "Fresno", display_name: "Ana" };
  await withStub(() => jsonResponse({ data }), async (calls) => {
    assertEquals(await getDocumentCredit("abc"), data);
    assertEquals(calls[0].url.pathname, "/api/2.0/documents/abc/credit/");
  });
});

Deno.test("getSharedDocument: GET documents/shared/<token>/", async () => {
  await withStub(() => jsonResponse({ data: SHARED }), async (calls) => {
    assertEquals(await getSharedDocument("t0k"), SHARED);
    assertEquals(calls[0].url.pathname, "/api/2.0/documents/shared/t0k/");
  });
});

Deno.test("getSharedDocumentChanges: version only, or the whole shared document", async () => {
  await withStub(
    (_url, _init, call) =>
      jsonResponse({ data: call === 0 ? { version: 4 } : SHARED }),
    async (calls) => {
      assertEquals(await getSharedDocumentChanges("t0k", 4), { version: 4 });
      assertEquals(await getSharedDocumentChanges("t0k", 3), SHARED);
      assertEquals(
        calls[0].url.pathname,
        "/api/2.0/documents/shared/t0k/changes/",
      );
      assertEquals(calls[1].url.searchParams.get("since"), "3");
    },
  );
});

Deno.test("profile: GET and PUT documents/profile/", async () => {
  await withStub(
    (_url, _init, call) =>
      jsonResponse({ data: { display_name: call === 0 ? null : "Ana" } }),
    async (calls) => {
      assertEquals(await getDocumentProfile(), { display_name: null });
      assertEquals(
        await updateDocumentProfile({ display_name: "Ana" }),
        { display_name: "Ana" },
      );
      assertEquals(calls[0].url.pathname, "/api/2.0/documents/profile/");
      assertEquals(method(calls[0]), "GET");
      assertEquals(method(calls[1]), "PUT");
      assertEquals(calls[1].url.pathname, "/api/2.0/documents/profile/");
      assertEquals(JSON.parse(calls[1].init.body as string), {
        display_name: "Ana",
      });
      assertEquals(header(calls[1], "x-csrftoken"), "tok");
    },
  );
});

Deno.test("ids and tokens are encoded into the path", async () => {
  await withStub(() => jsonResponse({ data: SHARED }), async (calls) => {
    await getSharedDocument("a/b?c");
    assertEquals(
      calls[0].url.pathname,
      "/api/2.0/documents/shared/a%2Fb%3Fc/",
    );
    assertEquals(calls[0].url.search, "");
  });
});

Deno.test("options: init headers and signal are forwarded", async () => {
  await withStub(() => jsonResponse({ data: DOCUMENT }), async (calls) => {
    const controller = new AbortController();
    await getDocument("abc", {
      signal: controller.signal,
      init: { headers: { Cookie: "sessionid=x" } },
    });
    assertEquals(header(calls[0], "cookie"), "sessionid=x");
    assertEquals(calls[0].init.signal, controller.signal);
  });
});

Deno.test("options: an aborted call rejects with the signal's reason", async () => {
  await withStub(() => jsonResponse({ data: DOCUMENT }), async () => {
    const controller = new AbortController();
    controller.abort("why");
    const error = await assertRejects(() =>
      getDocument("abc", { signal: controller.signal })
    );
    assertEquals(error, "why");
  });
});

// --- Refusals --------------------------------------------------------------

Deno.test("a 409 stale_base becomes a DocumentRefusal with its data", async () => {
  const data = {
    version: 5,
    schema_version: 1,
    changes: [{ ...ENTRY, version: 5 }],
    document: { ...DOCUMENT, version: 5 },
  };
  await withStub(refusal("stale_base", 409, data), async () => {
    const error = await assertRejects(() => saveDocument("abc", FORM));
    assertInstanceOf(error, DocumentRefusal);
    assertInstanceOf(error, Error);
    assertEquals(error.code, "stale_base");
    assertEquals(error.status, 409);
    assertEquals(error.message, "refused: stale_base");
    assertEquals(error.name, "DocumentRefusal");
    assert(isDocumentRefusal(error, "stale_base"));
    const stale = staleBaseDataSchema.parse(error.data);
    assertEquals(stale.changes, data.changes);
    assertEquals(stale.document.version, 5);
  });
});

Deno.test("a 404 shared read becomes not_found", async () => {
  await withStub(refusal("not_found", 404), async () => {
    const error = await assertRejects(() => getSharedDocument("nope"));
    assert(isDocumentRefusal(error, "not_found"));
    assertEquals(error.status, 404);
    assertEquals(error.data, undefined);
  });
});

Deno.test("a 400 invalid carries data.fields", async () => {
  const data = { fields: { name: ["Too long."] } };
  await withStub(refusal("invalid", 400, data), async () => {
    const error = await assertRejects(() =>
      updateDocumentProfile({ display_name: "x" })
    );
    assert(isDocumentRefusal(error, "invalid"));
    assertEquals(error.data, data);
  });
});

Deno.test("a 204 endpoint's refusal is a DocumentRefusal too", async () => {
  await withStub(refusal("not_deleted", 409), async () => {
    const error = await assertRejects(() => deleteDocument("abc"));
    assert(isDocumentRefusal(error, "not_deleted"));
  });
});

Deno.test("signed out: resticus's 401 without a code becomes unauthorized", async () => {
  const body = {
    errors: {
      detail: [{ message: "You must be logged in to access this endpoint." }],
    },
  };
  await withStub(() => json(body, 401), async () => {
    const error = await assertRejects(() => listDocuments());
    assert(isDocumentRefusal(error, "unauthorized"));
    assertEquals(error.status, 401);
    assertEquals(
      error.message,
      "You must be logged in to access this endpoint.",
    );
  });
});

Deno.test("a 403 without a code (a CSRF failure) becomes forbidden", async () => {
  const body = { errors: { detail: [{ message: "CSRF Failed: x" }] } };
  await withStub(() => json(body, 403), async () => {
    const error = await assertRejects(() => saveDocument("abc", FORM));
    assert(isDocumentRefusal(error, "forbidden"));
    assertEquals(error.status, 403);
  });
});

Deno.test("an error without a code or errors body becomes unknown", async () => {
  await withStub(() => json({ oops: true }, 500), async () => {
    const error = await assertRejects(() => getDocument("abc"));
    assert(isDocumentRefusal(error, "unknown"));
    assertEquals(error.status, 500);
  });
});

Deno.test("a refusal keeps the failed request as its cause", async () => {
  await withStub(refusal("gone", 410), async () => {
    const error = await assertRejects(() => getDocument("abc"));
    assert(isDocumentRefusal(error, "gone"));
    // deno-lint-ignore no-explicit-any
    const cause = error.cause as any;
    assertEquals(cause.result.status, 410);
    assertEquals(cause.url.pathname, "/api/2.0/documents/abc/");
  });
});

Deno.test("a malformed success response is rejected by the schema", async () => {
  await withStub(
    () => jsonResponse({ data: { ...DOCUMENT, version: "4" } }),
    async () => {
      const error = await assertRejects(() => getDocument("abc"));
      assertFalse(isDocumentRefusal(error));
      assertInstanceOf(error, DocumentResponseError);
      assertEquals(error.name, "DocumentResponseError");
    },
  );
  await withStub(
    () => jsonResponse({ data: { ...DOCUMENT, body: undefined } }),
    async () => {
      await assertRejects(() => getDocument("abc"));
    },
  );
  await withStub(() => jsonResponse({ nope: 1 }), async () => {
    await assertRejects(() => listDocuments());
  });
});

Deno.test("a shared document without its id is rejected", async () => {
  const { id: _id, ...noId } = SHARED;
  await withStub(() => jsonResponse({ data: noId }), async () => {
    const error = await assertRejects(() => getSharedDocument("t0k"));
    assertFalse(isDocumentRefusal(error));
  });
});

Deno.test("an HTML 503 (a proxy error) becomes unknown with its status", async () => {
  const respond = () =>
    new Response("<h1>Service Unavailable</h1>", {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  await withStub(respond, async () => {
    const error = await assertRejects(() => saveDocument("abc", FORM));
    assert(isDocumentRefusal(error, "unknown"));
    assertEquals(error.status, 503);
    assertEquals(error.data, undefined);
  });
});

Deno.test("an HTML 404 (an unmatched route) becomes not_found", async () => {
  const respond = () =>
    new Response("<h1>Not Found</h1>", {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  await withStub(respond, async () => {
    const error = await assertRejects(() => getDocument("abc"));
    assert(isDocumentRefusal(error, "not_found"));
    assertEquals(error.status, 404);
  });
});

Deno.test("a JSON 404 without a code becomes not_found", async () => {
  const body = { errors: { detail: [{ message: "Not found." }] } };
  await withStub(() => json(body, 404), async () => {
    const error = await assertRejects(() => getDocument("abc"));
    assert(isDocumentRefusal(error, "not_found"));
  });
});

Deno.test("an empty-body error, with or without a Content-Type, keeps its status", async () => {
  await withStub(() => new Response(null, { status: 502 }), async () => {
    const error = await assertRejects(() => listDocuments());
    assert(isDocumentRefusal(error, "unknown"));
    assertEquals(error.status, 502);
  });
  await withStub(
    () =>
      new Response("", {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    async () => {
      const error = await assertRejects(() => deleteDocument("abc"));
      assert(isDocumentRefusal(error, "unknown"));
      assertEquals(error.status, 500);
    },
  );
  await withStub(() => new Response(null, { status: 401 }), async () => {
    const error = await assertRejects(() => getDocumentProfile());
    assert(isDocumentRefusal(error, "unauthorized"));
  });
});

Deno.test("a non-JSON success is a DocumentResponseError, not a refusal", async () => {
  const respond = () =>
    new Response("<html></html>", {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  await withStub(respond, async () => {
    const error = await assertRejects(() => getDocument("abc"));
    assertInstanceOf(error, DocumentResponseError);
    assertEquals(error.name, "DocumentResponseError");
    assertFalse(isDocumentRefusal(error));
  });
});

Deno.test("isDocumentRefusal: matches the class, and the code when given", () => {
  const error = new DocumentRefusal("x", "gone", 410, undefined);
  assert(isDocumentRefusal(error));
  assert(isDocumentRefusal(error, "gone"));
  assertFalse(isDocumentRefusal(error, "not_found"));
  assertFalse(isDocumentRefusal(new Error("x")));
  assertFalse(isDocumentRefusal("gone"));
});

Deno.test("REFUSAL_CODES lists every wire code and the fallbacks", () => {
  assertEquals([...REFUSAL_CODES].sort(), [
    "account_mismatch",
    "build_blocked",
    "forbidden",
    "gone",
    "id_taken",
    "invalid",
    "limit_documents",
    "limit_storage",
    "not_deleted",
    "not_found",
    "rate_limited",
    "schema_downgrade",
    "sharing_blocked",
    "stale_base",
    "too_large",
    "unauthorized",
    "unknown",
  ]);
});
