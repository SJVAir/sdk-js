import { assert, assertEquals, assertRejects } from "@std/assert";
import {
  apiCall,
  fetchAllBulkPages,
  paginatedApiCall,
  resetRequestDefaults,
  setOrigin,
  setRequestDefaults,
} from "./mod.ts";
import { jsonResponse, stubFetch } from "./fetch_stub_test_utils.ts";

setOrigin("https://www.sjvair.com");

async function withStub(
  fn: (stub: ReturnType<typeof stubFetch>) => Promise<void>,
  respond?: Parameters<typeof stubFetch>[0],
) {
  const stub = stubFetch(respond);
  try {
    await fn(stub);
  } finally {
    resetRequestDefaults();
    stub.restore();
  }
}

Deno.test("defaults: static headers are sent", async () => {
  await withStub(async ({ calls }) => {
    setRequestDefaults({ headers: { "Accept-Language": "en" } });
    await apiCall("time");
    assertEquals(
      new Headers(calls[0].init.headers).get("accept-language"),
      "en",
    );
  });
});

Deno.test("defaults: header function runs on every request", async () => {
  await withStub(async ({ calls }) => {
    let n = 0;
    setRequestDefaults({ headers: () => ({ "X-N": String(++n) }) });
    await apiCall("time");
    await apiCall("time");
    assertEquals(new Headers(calls[0].init.headers).get("x-n"), "1");
    assertEquals(new Headers(calls[1].init.headers).get("x-n"), "2");
  });
});

Deno.test("defaults: credentials applied, and unset leaves fetch's default", async () => {
  await withStub(async ({ calls }) => {
    setRequestDefaults({ credentials: "include" });
    await apiCall("time");
    assertEquals(calls[0].init.credentials, "include");
    resetRequestDefaults();
    await apiCall("time");
    assertEquals(calls[1].init.credentials, undefined);
  });
});

Deno.test("merge: order is defaults < function < caller", async () => {
  await withStub(async ({ calls }) => {
    setRequestDefaults({
      headers: { "X-A": "d", "X-B": "d", "X-C": "d" },
    });
    await apiCall({
      url: "time",
      init: { headers: { "X-B": "f", "X-C": "f" } },
      options: { init: { headers: { "X-C": "c" } } },
    });
    const headers = new Headers(calls[0].init.headers);
    assertEquals(headers.get("x-a"), "d");
    assertEquals(headers.get("x-b"), "f");
    assertEquals(headers.get("x-c"), "c");
  });
});

Deno.test("merge: header names are case-insensitive", async () => {
  await withStub(async ({ calls }) => {
    setRequestDefaults({ headers: { authorization: "Token d" } });
    await apiCall({
      url: "time",
      init: { headers: { Authorization: "Token f" } },
    });
    assertEquals(
      new Headers(calls[0].init.headers).get("authorization"),
      "Token f",
    );
  });
});

Deno.test("merge: caller init fields override function init", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({
      url: "time",
      init: { method: "POST" },
      options: { init: { cache: "no-store" } },
    });
    assertEquals(calls[0].init.method, "POST");
    assertEquals(calls[0].init.cache, "no-store");
  });
});

Deno.test("signal: forwarded, and wins over init.signal", async () => {
  await withStub(async ({ calls }) => {
    const a = new AbortController();
    const b = new AbortController();
    await apiCall({
      url: "time",
      options: { signal: a.signal, init: { signal: b.signal } },
    });
    assert(calls[0].init.signal === a.signal);
  });
});

const pageResponder = (call: number) =>
  jsonResponse(
    call === 0
      ? { data: [call], page: 1, pages: 3, count: 3, has_next_page: true }
      : { data: [call] },
  );

Deno.test("signal: reaches every page of paginatedApiCall", async () => {
  await withStub(async ({ calls }) => {
    const ctrl = new AbortController();
    await paginatedApiCall({
      url: "monitors",
      options: { signal: ctrl.signal },
    });
    assertEquals(calls.length, 3);
    for (const call of calls) assert(call.init.signal === ctrl.signal);
  }, (_url, _init, call) => pageResponder(call));
});

Deno.test("signal: reaches every page of fetchAllBulkPages", async () => {
  await withStub(async ({ calls }) => {
    const ctrl = new AbortController();
    await fetchAllBulkPages({
      url: "monitors/bulk",
      options: { signal: ctrl.signal },
    });
    assertEquals(calls.length, 3);
    for (const call of calls) assert(call.init.signal === ctrl.signal);
  }, (_url, _init, call) => pageResponder(call));
});

Deno.test("signal: abort rejects with the original AbortError", async () => {
  await withStub(async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const error = await assertRejects(() =>
      apiCall({ url: "time", options: { signal: ctrl.signal } })
    );
    assert(error instanceof DOMException);
    assertEquals(error.name, "AbortError");
    assertEquals(error.cause, undefined);
  });
});

Deno.test("signal: abort mid-pagination rejects", async () => {
  const ctrl = new AbortController();
  await withStub(async () => {
    const error = await assertRejects(() =>
      paginatedApiCall({
        url: "monitors",
        options: { signal: ctrl.signal },
      })
    );
    assertEquals((error as Error).name, "AbortError");
  }, (_url, _init, call) => {
    if (call === 1) ctrl.abort();
    return pageResponder(call);
  });
});

Deno.test("error cause: Authorization and CSRF header are redacted", async () => {
  await withStub(async () => {
    const error = await assertRejects(() =>
      apiCall({
        url: "time",
        init: { headers: { Authorization: "Token secret" } },
      })
    );
    // deno-lint-ignore no-explicit-any
    const cause = (error as any).cause;
    assertEquals(
      new Headers(cause.init.headers).get("authorization"),
      "[redacted]",
    );
  }, () =>
    new Response(JSON.stringify({ errors: [] }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }));
});
