import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { jsonResponse, stubFetch } from "./http/fetch_stub_test_utils.ts";
import { getMonitorSummariesDailyOpen } from "./monitors/get_monitor_summaries.ts";
import { getRegionSummariesDailyOpen } from "./regions/get_region_summaries.ts";

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
