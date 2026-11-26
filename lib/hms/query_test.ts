import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { assertEquals } from "@std/assert";
import { getHMSSmoke } from "./smoke/get_smoke.ts";
import { getHMSFire } from "./fire/get_fire.ts";

const page = (n: number, pages: number) => ({
  data: [{ id: `p${n}` }],
  page: n,
  count: pages,
  pages,
  has_next_page: n < pages,
  has_previous_page: n > 1,
});

const params = (url: URL) => Object.fromEntries(url.searchParams);

Deno.test("getHMSSmoke sends one day as date", async () => {
  const stub = stubFetch(() => jsonResponse(page(1, 1)));
  try {
    await getHMSSmoke({ date: "2025-09-07" });
    assertEquals(stub.calls.length, 1);
    assertEquals(stub.calls[0].url.pathname.endsWith("/hms/smoke/"), true);
    assertEquals(params(stub.calls[0].url), { date: "2025-09-07" });
  } finally {
    stub.restore();
  }
});

Deno.test("getHMSSmoke sends a range, region and density", async () => {
  const stub = stubFetch(() => jsonResponse(page(1, 1)));
  try {
    await getHMSSmoke({
      start: "2025-09-01",
      end: "2025-09-30",
      region_id: "5nO2A8",
      density: "heavy",
    });
    assertEquals(params(stub.calls[0].url), {
      date__gte: "2025-09-01",
      date__lte: "2025-09-30",
      region_id: "5nO2A8",
      density: "heavy",
    });
  } finally {
    stub.restore();
  }
});

Deno.test("getHMSFire sends an open-ended range and a region", async () => {
  const stub = stubFetch(() => jsonResponse(page(1, 1)));
  try {
    await getHMSFire({ start: "2025-09-01", region_id: "5nO2A8" });
    assertEquals(stub.calls[0].url.pathname.endsWith("/hms/fire/"), true);
    assertEquals(params(stub.calls[0].url), {
      date__gte: "2025-09-01",
      region_id: "5nO2A8",
    });
  } finally {
    stub.restore();
  }
});

Deno.test("getHMSSmoke and getHMSFire without a query send no filters", async () => {
  const stub = stubFetch(() => jsonResponse(page(1, 1)));
  try {
    await getHMSSmoke();
    await getHMSFire(undefined, {});
    assertEquals(params(stub.calls[0].url), {});
    assertEquals(params(stub.calls[1].url), {});
  } finally {
    stub.restore();
  }
});

Deno.test("getHMSFire fetches every page of a range, with the range on each", async () => {
  const stub = stubFetch((url) =>
    jsonResponse(page(Number(url.searchParams.get("page") ?? 1), 3))
  );
  try {
    const fires = await getHMSFire({ start: "2025-09-01", end: "2025-09-30" });
    assertEquals(fires.map((f) => f.id), ["p1", "p2", "p3"]);
    assertEquals(stub.calls.length, 3);
    for (const { url } of stub.calls) {
      assertEquals(url.searchParams.get("date__gte"), "2025-09-01");
      assertEquals(url.searchParams.get("date__lte"), "2025-09-30");
    }
    assertEquals(
      stub.calls.slice(1).map(({ url }) => url.searchParams.get("page")),
      ["2", "3"],
    );
  } finally {
    stub.restore();
  }
});

Deno.test("getHMSSmoke passes the signal to every page", async () => {
  const controller = new AbortController();
  const stub = stubFetch((url, _init, call) => {
    if (call === 1) controller.abort("stop");
    return jsonResponse(page(Number(url.searchParams.get("page") ?? 1), 3));
  });
  try {
    const reason = await getHMSSmoke(
      { date: "2025-09-07" },
      { signal: controller.signal },
    ).then(() => "resolved", (e) => e);
    assertEquals(reason, "stop");
  } finally {
    stub.restore();
  }
});

Deno.test("an HMS query can't mix date with start/end", () => {
  // Type-level only: never called.
  const _check = () => {
    // @ts-expect-error: one day or a range, not both
    getHMSSmoke({ date: "2025-09-07", start: "2025-09-01" });
    // @ts-expect-error: fires have no density
    getHMSFire({ density: "heavy" });
  };
});
