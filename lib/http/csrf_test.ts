import { assert, assertEquals, assertRejects } from "@std/assert";
import {
  apiCall,
  resetRequestDefaults,
  setOrigin,
  setRequestDefaults,
} from "./mod.ts";
import { setEnvironmentForTests } from "./environment.ts";
import { stubFetch } from "./fetch_stub_test_utils.ts";

const COOKIE = "a=1; csrftoken=tok%3D1; b=2";
const ORIGIN = "https://www.sjvair.com";

async function withStub(
  fn: (stub: ReturnType<typeof stubFetch>) => Promise<void>,
  options: {
    env?: { cookie?: string; origin?: string } | null;
    origin?: string;
    respond?: Parameters<typeof stubFetch>[0];
  } = {},
) {
  const stub = stubFetch(options.respond);
  setEnvironmentForTests(
    options.env === undefined
      ? { cookie: COOKIE, origin: ORIGIN }
      : options.env,
  );
  setOrigin(options.origin ?? ORIGIN);
  try {
    await fn(stub);
  } finally {
    resetRequestDefaults();
    setEnvironmentForTests(null);
    setOrigin(ORIGIN);
    stub.restore();
  }
}

function header(call: { init: RequestInit }, name: string) {
  return new Headers(call.init.headers).get(name);
}

Deno.test("csrf: sent on POST, PUT, PATCH, DELETE", async () => {
  await withStub(async ({ calls }) => {
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      await apiCall({ url: "time", init: { method } });
    }
    assertEquals(calls.length, 4);
    for (const call of calls) {
      assertEquals(header(call, "x-csrftoken"), "tok=1");
    }
  });
});

Deno.test("csrf: not sent on GET or HEAD", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "GET" } });
    await apiCall({ url: "time", init: { method: "HEAD" } });
    await apiCall("time");
    for (const call of calls) assertEquals(header(call, "x-csrftoken"), null);
  });
});

Deno.test("csrf: method is matched case-insensitively", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "post" } });
    assertEquals(header(calls[0], "x-csrftoken"), "tok=1");
  });
});

Deno.test("csrf: not sent to another origin", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[0], "x-csrftoken"), null);
  }, { origin: "https://api.example.com" });
});

Deno.test("csrf: cookie missing sends no header", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(calls.length, 1);
    assertEquals(header(calls[0], "x-csrftoken"), null);
  }, { env: { cookie: "a=1", origin: ORIGIN } });
});

Deno.test("csrf: no page origin sends no header", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[0], "x-csrftoken"), null);
  }, { env: { cookie: "csrftoken=t" } });
});

Deno.test("csrf: not in a browser", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[0], "x-csrftoken"), null);
  }, { env: null });
});

Deno.test("csrf: disabled with csrf: false", async () => {
  await withStub(async ({ calls }) => {
    setRequestDefaults({ csrf: false });
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[0], "x-csrftoken"), null);
  });
});

Deno.test("csrf: custom cookie and header names", async () => {
  await withStub(async ({ calls }) => {
    setRequestDefaults({ csrf: { cookieName: "ct", headerName: "X-Token" } });
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[0], "x-token"), "v");
    assertEquals(header(calls[0], "x-csrftoken"), null);
  }, { env: { cookie: "ct=v", origin: ORIGIN } });
});

Deno.test("csrf: overridden by caller and by defaults", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({
      url: "time",
      init: { method: "POST" },
      options: { init: { headers: { "X-CSRFToken": "mine" } } },
    });
    assertEquals(header(calls[0], "x-csrftoken"), "mine");

    setRequestDefaults({ headers: { "X-CSRFToken": "d" } });
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[1], "x-csrftoken"), "d");
  });
});

Deno.test("csrf: read fresh on every request", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({ url: "time", init: { method: "POST" } });
    setEnvironmentForTests({ cookie: "csrftoken=second", origin: ORIGIN });
    await apiCall({ url: "time", init: { method: "POST" } });
    assertEquals(header(calls[0], "x-csrftoken"), "tok=1");
    assertEquals(header(calls[1], "x-csrftoken"), "second");
  });
});

Deno.test("csrf: sent alongside a token", async () => {
  await withStub(async ({ calls }) => {
    await apiCall({
      url: "time",
      init: { method: "POST", headers: { Authorization: "Token t" } },
    });
    assertEquals(header(calls[0], "x-csrftoken"), "tok=1");
    assertEquals(header(calls[0], "authorization"), "Token t");
  });
});

const failing = () =>
  new Response(JSON.stringify({ errors: [] }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });

async function causeHeader(name: string) {
  const error = await assertRejects(() =>
    apiCall({ url: "time", init: { method: "POST" } })
  );
  // deno-lint-ignore no-explicit-any
  const cause = (error as any).cause;
  assert(cause);
  return new Headers(cause.init.headers).get(name);
}

Deno.test("csrf: header value is redacted in error cause", async () => {
  await withStub(async () => {
    assertEquals(await causeHeader("x-csrftoken"), "[redacted]");
  }, { respond: failing });
});

Deno.test("csrf: custom header name is redacted in error cause", async () => {
  await withStub(async () => {
    setRequestDefaults({ csrf: { headerName: "X-Token" } });
    assertEquals(await causeHeader("x-token"), "[redacted]");
  }, { respond: failing });
});
