import { assert, assertEquals, assertRejects } from "@std/assert";
import type { RequestOptions } from "$http";
import { stubFetch } from "./http/fetch_stub_test_utils.ts";
import { getCollocationSites } from "./collocation_sites/get_collocation_sites.ts";
import { getHMSFire } from "./hms/fire/get_fire.ts";
import { getHMSFireById } from "./hms/fire/get_fire_by_id.ts";
import { getHMSSmoke } from "./hms/smoke/get_smoke.ts";
import { getHMSSmokeById } from "./hms/smoke/get_smoke_by_id.ts";
import {
  getClosestMonitor,
  getClosestMonitors,
} from "./monitors/get_closest_monitor.ts";
import {
  getMonitorArchive,
  listAllMonitorArchives,
  listMonitorArchivesPage,
} from "./monitors/get_monitor_archives.ts";
import { getMonitorDetails } from "./monitors/get_monitor_details.ts";
import { getMonitorEntries } from "./monitors/get_monitor_entries.ts";
import { getMonitorEntriesExportJSON } from "./monitors/get_monitor_entries_export.ts";
import {
  getMonitorSummariesDaily,
  getMonitorSummariesHourly,
  getMonitorSummariesMonthly,
  getMonitorSummariesQuarterly,
  getMonitorSummariesSeasonal,
  getMonitorSummariesYearly,
} from "./monitors/get_monitor_summaries.ts";
import {
  getMonitorSummariesBulkDaily,
  getMonitorSummariesBulkHourly,
  getMonitorSummariesBulkMonthly,
  getMonitorSummariesBulkQuarterly,
  getMonitorSummariesBulkSeasonal,
  getMonitorSummariesBulkYearly,
} from "./monitors/get_monitor_summaries_bulk.ts";
import { getMonitors } from "./monitors/get_monitors.ts";
import { getMonitorsList } from "./monitors/get_monitors_list.ts";
import { getMonitorsMeta } from "./monitors/get_monitors_meta.ts";
import type { MonitorEntriesArchive } from "./monitors/types.ts";
import { getChemicalDetails } from "./pesticides/get_chemical_details.ts";
import { getChemicalsList } from "./pesticides/get_chemicals_list.ts";
import { getCommoditiesList } from "./pesticides/get_commodities_list.ts";
import { getCommodityDetails } from "./pesticides/get_commodity_details.ts";
import { getPesticideNoticeDetails } from "./pesticides/get_pesticide_notice_details.ts";
import { getPesticideNoticeList } from "./pesticides/get_pesticide_notice_list.ts";
import { getPesticideUseDetails } from "./pesticides/get_pesticide_use_details.ts";
import { getPesticideUseList } from "./pesticides/get_pesticide_use_list.ts";
import { getProductDetails } from "./pesticides/get_product_details.ts";
import { getProductsList } from "./pesticides/get_products_list.ts";
import { getRegionPesticideNotices } from "./pesticides/get_region_pesticide_notices.ts";
import { getRegionPesticideSummary } from "./pesticides/get_region_pesticide_summary.ts";
import { getRegionPesticideUse } from "./pesticides/get_region_pesticide_use.ts";
import { getRegionDetails } from "./regions/get_region_details.ts";
import {
  lookupRegionPlace,
  searchRegionPlaces,
} from "./regions/get_region_places.ts";
import {
  getRegionSummariesDaily,
  getRegionSummariesHourly,
  getRegionSummariesMonthly,
  getRegionSummariesQuarterly,
  getRegionSummariesSeasonal,
  getRegionSummariesYearly,
} from "./regions/get_region_summaries.ts";
import {
  getRegionSummariesBulkDaily,
  getRegionSummariesBulkHourly,
  getRegionSummariesBulkMonthly,
  getRegionSummariesBulkQuarterly,
  getRegionSummariesBulkSeasonal,
  getRegionSummariesBulkYearly,
} from "./regions/get_region_summaries_bulk.ts";
import { getRegionsList } from "./regions/get_regions_list.ts";
import { getRegionsMeta } from "./regions/get_regions_meta.ts";

const entry = { monitorId: "m", entryType: "pm25" } as const;
const summary = { ...entry, year: 2025 };
const regionSummary = { regionId: "r", entryType: "pm25" as const, year: 2025 };
const bulk = {
  entryType: "pm25" as const,
  start: "2025-01-01",
  end: "2025-01-02",
};
const regionBulk = { ...bulk, region: "r" };
const archive = {
  url: "/api/2.0/monitors/m/archive/x/",
} as MonitorEntriesArchive;

const rows: Array<[string, (options: RequestOptions) => Promise<unknown>]> = [
  ["getCollocationSites", (o) => getCollocationSites(o)],
  ["getHMSFire", (o) => getHMSFire(o)],
  ["getHMSFireById", (o) => getHMSFireById("x", o)],
  ["getHMSSmoke", (o) => getHMSSmoke(o)],
  ["getHMSSmokeById", (o) => getHMSSmokeById("x", o)],
  ["getClosestMonitors", (o) => getClosestMonitors("pm25", 1, 2, o)],
  ["getClosestMonitor", (o) => getClosestMonitor("pm25", 1, 2, o)],
  ["listMonitorArchivesPage", (o) => listMonitorArchivesPage("m", 1, o)],
  ["listAllMonitorArchives", (o) => listAllMonitorArchives("m", o)],
  ["getMonitorArchive", (o) => getMonitorArchive(archive, o)],
  ["getMonitorDetails", (o) => getMonitorDetails("m", o)],
  ["getMonitorEntries", (o) => getMonitorEntries(entry, o)],
  [
    "getMonitorEntriesExportJSON",
    (o) =>
      getMonitorEntriesExportJSON(
        { monitorId: "m", startDate: "2025-01-01", endDate: "2025-01-02" },
        o,
      ),
  ],
  ["getMonitorSummariesHourly", (o) => getMonitorSummariesHourly(summary, o)],
  ["getMonitorSummariesDaily", (o) => getMonitorSummariesDaily(summary, o)],
  ["getMonitorSummariesMonthly", (o) => getMonitorSummariesMonthly(summary, o)],
  [
    "getMonitorSummariesQuarterly",
    (o) => getMonitorSummariesQuarterly(summary, o),
  ],
  [
    "getMonitorSummariesSeasonal",
    (o) => getMonitorSummariesSeasonal(summary, o),
  ],
  ["getMonitorSummariesYearly", (o) => getMonitorSummariesYearly(entry, o)],
  [
    "getMonitorSummariesBulkHourly",
    (o) => getMonitorSummariesBulkHourly(bulk, o),
  ],
  [
    "getMonitorSummariesBulkDaily",
    (o) => getMonitorSummariesBulkDaily(bulk, o),
  ],
  [
    "getMonitorSummariesBulkMonthly",
    (o) => getMonitorSummariesBulkMonthly(bulk, o),
  ],
  [
    "getMonitorSummariesBulkQuarterly",
    (o) => getMonitorSummariesBulkQuarterly(bulk, o),
  ],
  [
    "getMonitorSummariesBulkSeasonal",
    (o) => getMonitorSummariesBulkSeasonal(bulk, o),
  ],
  [
    "getMonitorSummariesBulkYearly",
    (o) => getMonitorSummariesBulkYearly(bulk, o),
  ],
  ["getMonitors", (o) => getMonitors("pm25", undefined, o)],
  [
    "getMonitors (at)",
    (o) => getMonitors("pm25", { timestamp: "2025-01-01" }, o),
  ],
  ["getMonitorsList", (o) => getMonitorsList(o)],
  ["getMonitorsMeta", (o) => getMonitorsMeta(o)],
  ["getChemicalDetails", (o) => getChemicalDetails("c", o)],
  ["getChemicalsList", (o) => getChemicalsList({}, o)],
  ["getCommoditiesList", (o) => getCommoditiesList({}, o)],
  ["getCommodityDetails", (o) => getCommodityDetails("c", o)],
  ["getPesticideNoticeDetails", (o) => getPesticideNoticeDetails("n", o)],
  ["getPesticideNoticeList", (o) => getPesticideNoticeList({}, o)],
  ["getPesticideUseDetails", (o) => getPesticideUseDetails("u", o)],
  ["getPesticideUseList", (o) => getPesticideUseList({}, o)],
  ["getProductDetails", (o) => getProductDetails("p", o)],
  ["getProductsList", (o) => getProductsList({}, o)],
  ["getRegionPesticideNotices", (o) => getRegionPesticideNotices("r", {}, o)],
  ["getRegionPesticideSummary", (o) => getRegionPesticideSummary("r", {}, o)],
  ["getRegionPesticideUse", (o) => getRegionPesticideUse("r", {}, o)],
  ["getRegionDetails", (o) => getRegionDetails("r", o)],
  ["searchRegionPlaces", (o) => searchRegionPlaces("x", undefined, o)],
  ["lookupRegionPlace", (o) => lookupRegionPlace("x", undefined, o)],
  [
    "getRegionSummariesHourly",
    (o) => getRegionSummariesHourly(regionSummary, o),
  ],
  ["getRegionSummariesDaily", (o) => getRegionSummariesDaily(regionSummary, o)],
  [
    "getRegionSummariesMonthly",
    (o) => getRegionSummariesMonthly(regionSummary, o),
  ],
  [
    "getRegionSummariesQuarterly",
    (o) => getRegionSummariesQuarterly(regionSummary, o),
  ],
  [
    "getRegionSummariesSeasonal",
    (o) => getRegionSummariesSeasonal(regionSummary, o),
  ],
  [
    "getRegionSummariesYearly",
    (o) => getRegionSummariesYearly(regionSummary, o),
  ],
  [
    "getRegionSummariesBulkHourly",
    (o) => getRegionSummariesBulkHourly(regionBulk, o),
  ],
  [
    "getRegionSummariesBulkDaily",
    (o) => getRegionSummariesBulkDaily(regionBulk, o),
  ],
  [
    "getRegionSummariesBulkMonthly",
    (o) => getRegionSummariesBulkMonthly(regionBulk, o),
  ],
  [
    "getRegionSummariesBulkQuarterly",
    (o) => getRegionSummariesBulkQuarterly(regionBulk, o),
  ],
  [
    "getRegionSummariesBulkSeasonal",
    (o) => getRegionSummariesBulkSeasonal(regionBulk, o),
  ],
  [
    "getRegionSummariesBulkYearly",
    (o) => getRegionSummariesBulkYearly(regionBulk, o),
  ],
  ["getRegionsList", (o) => getRegionsList({ name: "x" }, o)],
  ["getRegionsMeta", (o) => getRegionsMeta(o)],
];

for (const [name, call] of rows) {
  Deno.test(`forwards signal: ${name}`, async () => {
    const stub = stubFetch();
    try {
      const controller = new AbortController();
      controller.abort();
      const error = await assertRejects(() =>
        call({ signal: controller.signal })
      );
      assertEquals((error as Error).name, "AbortError");
      assert(stub.calls.length >= 1);
    } finally {
      stub.restore();
    }
  });
}

Deno.test("forwards caller init headers: getMonitorDetails", async () => {
  const stub = stubFetch();
  try {
    await getMonitorDetails("m", { init: { headers: { "X-Test": "1" } } });
    const headers = new Headers(stub.calls[0].init.headers);
    assertEquals(headers.get("X-Test"), "1");
  } finally {
    stub.restore();
  }
});
