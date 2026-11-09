import { assertEquals, assertRejects } from "@std/assert";
import { setOrigin } from "$http";
import { jsonResponse, stubFetch } from "./http/fetch_stub_test_utils.ts";
import { getMonitorSummariesDailyOpen } from "./monitors/get_monitor_summaries.ts";
import { getRegionSummariesDailyOpen } from "./regions/get_region_summaries.ts";
import { getMonitorSummariesBulkDailyOpen } from "./monitors/get_monitor_summaries_bulk.ts";
import { getRegionSummariesBulkDailyOpen } from "./regions/get_region_summaries_bulk.ts";

setOrigin("http://127.0.0.1:8000");

const row = {
  timestamp: "2026-11-09T00:00:00-08:00",
  entry_type: "pm25",
  resolution: "day",
  is_final: false,
};

Deno.test("getMonitorSummariesDailyOpen calls daily/open", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [row] }));
  try {
    const result = await getMonitorSummariesDailyOpen({
      monitorId: "abc",
      entryType: "pm25",
    });
    assertEquals(result as unknown, [row]);
    assertEquals(
      stub.calls[0].url.pathname,
      "/api/2.0/monitors/abc/summaries/pm25/daily/open/",
    );
    assertEquals(stub.calls[0].url.searchParams.has("processor"), false);
  } finally {
    stub.restore();
  }
});

Deno.test("getMonitorSummariesDailyOpen sends a processor", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getMonitorSummariesDailyOpen({
      monitorId: "abc",
      entryType: "pm25",
      processor: "PM25_EPA_Oct2021",
    });
    assertEquals(
      stub.calls[0].url.searchParams.get("processor"),
      "PM25_EPA_Oct2021",
    );
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionSummariesDailyOpen calls daily/open", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [row] }));
  try {
    const result = await getRegionSummariesDailyOpen({
      regionId: "r1",
      entryType: "pm25",
    });
    assertEquals(result as unknown, [row]);
    assertEquals(
      stub.calls[0].url.pathname,
      "/api/2.0/regions/r1/summaries/pm25/daily/open/",
    );
  } finally {
    stub.restore();
  }
});

const page = (data: unknown[], page = 1, pages = 1) =>
  jsonResponse({ data, page, pages, has_next_page: page < pages });
const owner = (id: string, summaries: Array<Record<string, unknown>>) => ({
  id,
  name: id,
  summaries,
});
const openRow = (d: number, mean_24h: number) => ({
  timestamp: `2026-11-0${d}T00:00:00-08:00`,
  mean_24h,
  is_final: false,
});

Deno.test("bulk open: URL and params", async () => {
  const stub = stubFetch(() => page([]));
  try {
    await getMonitorSummariesBulkDailyOpen({
      entryType: "pm25",
      bbox: [-120, 36, -119, 37],
      region: ["a", "b"],
    });
    const monitors = stub.calls[0].url;
    assertEquals(
      monitors.pathname,
      "/api/2.0/monitors/pm25/summaries/daily/open/",
    );
    assertEquals(monitors.searchParams.get("bbox"), "-120,36,-119,37");
    assertEquals(monitors.searchParams.getAll("region"), ["a", "b"]);
    assertEquals(monitors.searchParams.has("start"), false);
    assertEquals(monitors.searchParams.has("end"), false);

    await getRegionSummariesBulkDailyOpen({
      entryType: "pm25",
      region: ["a", "b"],
    });
    const regions = stub.calls[1].url;
    assertEquals(
      regions.pathname,
      "/api/2.0/regions/pm25/summaries/daily/open/",
    );
    assertEquals(regions.searchParams.getAll("region"), ["a", "b"]);
    assertEquals(regions.searchParams.has("start"), false);
  } finally {
    stub.restore();
  }
});

Deno.test("bulk open: processor '' is sent, undefined is not", async () => {
  const stub = stubFetch(() => page([]));
  try {
    await getMonitorSummariesBulkDailyOpen({
      entryType: "pm25",
      processor: "",
    });
    assertEquals(stub.calls[0].url.searchParams.get("processor"), "");
    await getMonitorSummariesBulkDailyOpen({ entryType: "pm25" });
    assertEquals(stub.calls[1].url.searchParams.has("processor"), false);
  } finally {
    stub.restore();
  }
});

Deno.test("bulk open: fetches every page", async () => {
  const stub = stubFetch((url) =>
    url.searchParams.get("page") === "2"
      ? page([owner("b", [openRow(9, 2)])], 2, 2)
      : page([owner("a", [openRow(9, 1)])], 1, 2)
  );
  try {
    const result = await getRegionSummariesBulkDailyOpen({
      entryType: "pm25",
      region: "r",
    });
    assertEquals(result as unknown, [
      owner("a", [openRow(9, 1)]),
      owner("b", [openRow(9, 2)]),
    ]);
  } finally {
    stub.restore();
  }
});

Deno.test("bulk open: owner repeated across pages kept once", async () => {
  const stub = stubFetch((url) =>
    url.searchParams.get("page") === "2"
      ? page([owner("a", [openRow(9, 2)]), owner("b", [])], 2, 2)
      : page([owner("a", [openRow(9, 1)])], 1, 2)
  );
  try {
    const result = await getMonitorSummariesBulkDailyOpen({
      entryType: "pm25",
    });
    assertEquals(result as unknown, [
      owner("a", [openRow(9, 1)]),
      owner("b", []),
    ]);
  } finally {
    stub.restore();
  }
});

Deno.test("bulk open: empty page 1", async () => {
  const stub = stubFetch(() => page([]));
  try {
    assertEquals(
      await getMonitorSummariesBulkDailyOpen({ entryType: "pm25" }),
      [],
    );
  } finally {
    stub.restore();
  }
});

Deno.test("bulk open: a 404 past the last page reads as empty", async () => {
  // The owner set can shrink between page 1 and the later pages (yesterday
  // settles), so the last page page 1 counted may no longer exist.
  const notFound = () =>
    new Response(JSON.stringify({ detail: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  const stub = stubFetch((url) =>
    url.searchParams.get("page") === "2"
      ? notFound()
      : page([owner("a", [openRow(9, 1)])], 1, 2)
  );
  try {
    assertEquals(
      await getMonitorSummariesBulkDailyOpen({ entryType: "pm25" }) as unknown,
      [owner("a", [openRow(9, 1)])],
    );
    assertEquals(
      await getRegionSummariesBulkDailyOpen({
        entryType: "pm25",
        region: "r",
      }) as unknown,
      [owner("a", [openRow(9, 1)])],
    );
  } finally {
    stub.restore();
  }
});

Deno.test("bulk open: a 404 on page 1 still rejects", async () => {
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ detail: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  );
  try {
    await assertRejects(() =>
      getMonitorSummariesBulkDailyOpen({ entryType: "pm25" })
    );
  } finally {
    stub.restore();
  }
});
