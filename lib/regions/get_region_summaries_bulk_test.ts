import { assertEquals } from "@std/assert";
import { mergeBulkPages } from "$http";
import type { RegionWithSummaries } from "./types.ts";

Deno.test({
  name: "getRegionSummariesBulk pagination/merge boundary",
  permissions: { net: false },
  fn: () => {
    const page1: Array<RegionWithSummaries> = [
      {
        id: "whole-region",
        name: "Whole",
        slug: "whole",
        type: "county",
        summaries: [{
          timestamp: "2026-01-01T00:00:00-08:00",
          entry_type: "pm25",
          resolution: "day",
          count: 24,
          expected_count: 24,
          minimum: 1,
          maximum: 2,
          mean: 1.5,
          stddev: 0.1,
          p25: 1,
          p75: 2,
          max_1h: null,
          max_8h: null,
          mean_24h: 1,
          station_count: 3,
          is_final: true,
        }],
      },
      {
        id: "split-region",
        name: "Split",
        slug: "split",
        type: "county",
        summaries: [{
          timestamp: "2026-01-01T00:00:00-08:00",
          entry_type: "pm25",
          resolution: "day",
          count: 24,
          expected_count: 24,
          minimum: 1,
          maximum: 2,
          mean: 1.5,
          stddev: 0.1,
          p25: 1,
          p75: 2,
          max_1h: null,
          max_8h: null,
          mean_24h: 1,
          station_count: 3,
          is_final: true,
        }],
      },
    ];
    const page2: Array<RegionWithSummaries> = [
      {
        id: "split-region",
        name: "Split",
        slug: "split",
        type: "county",
        summaries: [{
          timestamp: "2026-01-02T00:00:00-08:00",
          entry_type: "pm25",
          resolution: "day",
          count: 24,
          expected_count: 24,
          minimum: 1,
          maximum: 2,
          mean: 1.6,
          stddev: 0.1,
          p25: 1,
          p75: 2,
          max_1h: null,
          max_8h: null,
          mean_24h: 1,
          station_count: 3,
          is_final: true,
        }],
      },
      {
        id: "another-region",
        name: "Another",
        slug: "another",
        type: "county",
        summaries: [],
      },
    ];
    const merged = mergeBulkPages([page1, page2]);
    assertEquals(merged.map((r) => r.id), [
      "whole-region",
      "split-region",
      "another-region",
    ]);
    assertEquals(merged[1].summaries.length, 2);
  },
});

import { setOrigin } from "$http";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import {
  getRegionSummariesBulkDaily,
  getRegionSummariesBulkDailyOpen,
  getRegionSummariesBulkHourly,
  getRegionSummariesBulkMonthly,
  getRegionSummariesBulkQuarterly,
  getRegionSummariesBulkSeasonal,
  getRegionSummariesBulkYearly,
  type RegionSummaryBulkOpenRequestConfig,
  type RegionSummaryBulkRequestConfig,
} from "./get_region_summaries_bulk.ts";

setOrigin("http://127.0.0.1:8000");

const typePage = (data: unknown[], page = 1, pages = 1) =>
  jsonResponse({ data, page, pages, has_next_page: page < pages });
const typeRow = (day: number) => ({
  timestamp: `2026-01-0${day}T00:00:00-08:00`,
  entry_type: "pm25",
  resolution: "day",
  is_final: true,
});
const typeRegion = (id: string, summaries: unknown[]) => ({
  id,
  name: id,
  slug: id,
  type: "tract",
  summaries,
});

const fetchers = {
  hourly: getRegionSummariesBulkHourly,
  daily: getRegionSummariesBulkDaily,
  monthly: getRegionSummariesBulkMonthly,
  quarterly: getRegionSummariesBulkQuarterly,
  seasonal: getRegionSummariesBulkSeasonal,
  yearly: getRegionSummariesBulkYearly,
};

for (const [resolution, fetcher] of Object.entries(fetchers)) {
  Deno.test(`getRegionSummariesBulk ${resolution} sends type, not region`, async () => {
    const stub = stubFetch(() => typePage([]));
    try {
      await fetcher({
        entryType: "pm25",
        start: "2026-01-01",
        end: "2026-01-31",
        type: "tract",
      });
      const url = stub.calls[0].url;
      assertEquals(
        url.pathname,
        `/api/2.0/regions/pm25/summaries/${resolution}/`,
      );
      assertEquals(url.searchParams.getAll("type"), ["tract"]);
      assertEquals(url.searchParams.get("start"), "2026-01-01");
      assertEquals(url.searchParams.get("end"), "2026-01-31");
      assertEquals(url.searchParams.has("region"), false);
    } finally {
      stub.restore();
    }
  });
}

Deno.test("getRegionSummariesBulkDaily merges a type scope across pages", async () => {
  const stub = stubFetch((url) =>
    url.searchParams.get("page") === "2"
      ? typePage([typeRegion("b", [typeRow(2)]), typeRegion("c", [])], 2, 2)
      : typePage(
        [typeRegion("a", [typeRow(1)]), typeRegion("b", [typeRow(1)])],
        1,
        2,
      )
  );
  try {
    const result = await getRegionSummariesBulkDaily({
      entryType: "pm25",
      start: "2026-01-01",
      end: "2026-01-02",
      type: "tract",
    });
    assertEquals(stub.calls.length, 2);
    for (const call of stub.calls) {
      assertEquals(call.url.searchParams.getAll("type"), ["tract"]);
      assertEquals(call.url.searchParams.has("region"), false);
    }
    assertEquals(result.map((r) => r.id), ["a", "b", "c"]);
    assertEquals(
      result[1].summaries.map((s) => s.timestamp),
      [typeRow(1).timestamp, typeRow(2).timestamp],
    );
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionSummariesBulkDailyOpen sends type, not region", async () => {
  const stub = stubFetch(() => typePage([typeRegion("z1", [typeRow(1)])]));
  try {
    const result = await getRegionSummariesBulkDailyOpen({
      entryType: "pm25",
      type: "zipcode",
    });
    const url = stub.calls[0].url;
    assertEquals(url.pathname, "/api/2.0/regions/pm25/summaries/daily/open/");
    assertEquals(url.searchParams.getAll("type"), ["zipcode"]);
    assertEquals(url.searchParams.has("region"), false);
    assertEquals(result.map((r) => r.id), ["z1"]);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionSummariesBulkDaily still sends a region list", async () => {
  const stub = stubFetch(() => typePage([]));
  try {
    await getRegionSummariesBulkDaily({
      entryType: "pm25",
      start: "2026-01-01",
      end: "2026-01-31",
      region: ["a", "b"],
    });
    const url = stub.calls[0].url;
    assertEquals(url.searchParams.getAll("region"), ["a", "b"]);
    assertEquals(url.searchParams.has("type"), false);
  } finally {
    stub.restore();
  }
});

Deno.test("bulk region configs take exactly one of region or type", () => {
  const dates = { entryType: "pm25", start: "2026-01-01", end: "2026-01-31" };
  const byRegion: RegionSummaryBulkRequestConfig = { ...dates, region: "a" };
  const byType: RegionSummaryBulkRequestConfig = { ...dates, type: "mtrs" };
  const openByType: RegionSummaryBulkOpenRequestConfig = {
    entryType: "pm25",
    type: "tract",
  };
  // @ts-expect-error: neither region nor type
  const neither: RegionSummaryBulkRequestConfig = { ...dates };
  const both: RegionSummaryBulkRequestConfig = {
    ...dates,
    region: "a",
    // @ts-expect-error: both region and type
    type: "tract",
  };
  const landUse: RegionSummaryBulkRequestConfig = {
    ...dates,
    // @ts-expect-error: land_use isn't a bulk scope
    type: "land_use",
  };
  const place: RegionSummaryBulkRequestConfig = {
    ...dates,
    // @ts-expect-error: the server has no place regions
    type: "place",
  };
  // @ts-expect-error: open days need a scope too
  const openNeither: RegionSummaryBulkOpenRequestConfig = { entryType: "pm25" };
  assertEquals(
    [byRegion, byType, openByType, neither, both, landUse, place, openNeither]
      .length,
    8,
  );
});
