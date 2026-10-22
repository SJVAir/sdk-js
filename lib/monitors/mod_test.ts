import { origin, setOrigin } from "$http";
import {
  COORDINATES,
  EXISTING_MONITOR_ID,
  getSimpleValidationTest,
} from "$testing";
import {
  monitorClosestSchema,
  monitorDataSchema,
  monitorDetailsSchema,
  monitorEntriesArchiveSchema,
  monitorLatestSchema,
  monitorSummarySchema,
  someMonitorEntrySchema,
} from "./schemas/mod.ts";
import { getMonitorsList } from "./get_monitors_list.ts";
import {
  getClosestMonitor,
  getClosestMonitors,
} from "./get_closest_monitor.ts";
import { getMonitors } from "./get_monitors.ts";
import { getMonitorDetails } from "./get_monitor_details.ts";
import type { MonitorEntryType } from "./types.ts";
import { getMonitorEntries } from "./get_monitor_entries.ts";
import { assertEquals, assertExists, assertMatch, fail } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getMonitorEntriesCSVUrl } from "./get_monitor_entries_csv.ts";
import {
  getMonitorEntriesExportCSVUrl,
  getMonitorEntriesExportJSON,
} from "./get_monitor_entries_export.ts";
import { getMonitorsMeta } from "./get_monitors_meta.ts";
import { sjvairMonitorsMetaSchema } from "./schemas/monitors_meta.ts";
import {
  listAllMonitorArchives,
  listMonitorArchivesPage,
} from "./get_monitor_archives.ts";
import {
  getMonitorSummariesDaily,
  getMonitorSummariesHourly,
  getMonitorSummariesMonthly,
  getMonitorSummariesQuarterly,
  getMonitorSummariesSeasonal,
  getMonitorSummariesYearly,
} from "./get_monitor_summaries.ts";
import {
  getMonitorSummariesBulkDaily,
  mergeMonitorSummaryBulkPages,
} from "./get_monitor_summaries_bulk.ts";
import { monitorWithSummariesSchema } from "./schemas/mod.ts";
import type { MonitorWithSummaries } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const primaryPollutants: Array<MonitorEntryType> = ["pm25", "o3"];

const validateMonitorData = getSimpleValidationTest(monitorDataSchema);
const validateMonitorLatest = getSimpleValidationTest(monitorLatestSchema);
const validateMonitorDetails = getSimpleValidationTest(monitorDetailsSchema);
const validateClosestMonitor = getSimpleValidationTest(monitorClosestSchema);
const validateMonitorEntries = getSimpleValidationTest(someMonitorEntrySchema);
const validateMonitorsMeta = getSimpleValidationTest(sjvairMonitorsMetaSchema);
const validateMonitorArchive = getSimpleValidationTest(
  monitorEntriesArchiveSchema,
);
const validateMonitorSummary = getSimpleValidationTest(monitorSummarySchema);
const validateMonitorWithSummaries = getSimpleValidationTest(
  monitorWithSummariesSchema,
);

Deno.test({
  name: "Module: Monitors Endpoints",
  permissions: { net: true },
  async fn(t) {
    await t.step(
      "GET   monitors/meta",
      async () => validateMonitorsMeta(await getMonitorsMeta()),
    );

    await t.step(
      "GET   monitors/meta (vozbox single-sensor entries)",
      async () => {
        const meta = await getMonitorsMeta();
        const vozbox = meta.monitors.vozbox;

        assertExists(vozbox, "No vozbox entry found in monitors/meta response");
        assertEquals(vozbox.entries.o3.sensors, ["1"]);
        assertEquals(vozbox.entries.pm25.sensors, ["plantower", "sensirion"]);
      },
    );

    await t.step(
      "GET   monitors/meta (aqlite entries)",
      async () => {
        const meta = await getMonitorsMeta();
        const aqlite = meta.monitors.aqlite;

        assertExists(aqlite, "No aqlite entry found in monitors/meta response");
        assertEquals(aqlite.entries.o3.sensors, null);
      },
    );

    await t.step(
      "GET  monitors/",
      async () => validateMonitorData(await getMonitorsList()),
    );

    await t.step("GET  monitors/ (vozbox monitor type)", async () => {
      const monitors = await getMonitorsList();
      const vozbox = monitors.find((monitor) => monitor.type === "vozbox");

      assertExists(vozbox, "No vozbox monitor found in monitors/ response");
      assertEquals(typeof vozbox.sensor_id, "string");
      assertEquals(["fem", "frm", "lcs"].includes(vozbox.grade), true);
    });

    // Some steps need data a local copy of the server may not have. They're
    // skipped (shown as "ignored") with a note, instead of failing.
    const hasAqlite = (await getMonitorsList()).some((monitor) =>
      monitor.type === "aqlite"
    );
    if (!hasAqlite) {
      console.warn(
        "Skipping the aqlite monitor step: the server has no aqlite monitors.",
      );
    }

    const hasCurrentPm25 = (await getMonitors("pm25")).length > 0;
    if (!hasCurrentPm25) {
      console.warn(
        "Skipping the closest-monitor steps: no monitor has a current pm25 " +
          "reading (common with a local server whose data isn't recent).",
      );
    }

    await t.step({
      name: "GET  monitors/ (aqlite monitor type)",
      ignore: !hasAqlite,
      fn: async () => {
        const monitors = await getMonitorsList();
        const aqlite = monitors.find((monitor) => monitor.type === "aqlite");

        assertExists(aqlite, "No aqlite monitor found in monitors/ response");
        assertEquals(typeof aqlite.device_id, "string");
        assertEquals(["fem", "frm", "lcs"].includes(aqlite.grade), true);
      },
    });

    await t.step(
      "GET  monitors/{MONITOR_ID}/",
      async () =>
        validateMonitorDetails(await getMonitorDetails(EXISTING_MONITOR_ID)),
    );

    await t.step({
      name: "GET  monitors/{ENTRY_TYPE}/closest/",
      ignore: !hasCurrentPm25,
      fn: async () =>
        validateClosestMonitor(
          await getClosestMonitors(
            "pm25",
            COORDINATES.latitude,
            COORDINATES.longitude,
          ),
        ),
    });

    await t.step({
      name: "GET  monitors/{ENTRY_TYPE}/closest/ (single monitor validation)",
      ignore: !hasCurrentPm25,
      fn: async () =>
        validateClosestMonitor(
          await getClosestMonitor(
            "pm25",
            COORDINATES.latitude,
            COORDINATES.longitude,
          ),
        ),
    });

    await t.step(
      "GET  monitors/{MONITOR_ID}/archive/",
      async () => {
        const page = await listMonitorArchivesPage(EXISTING_MONITOR_ID);
        validateMonitorArchive(page.data);

        const archives = await listAllMonitorArchives(EXISTING_MONITOR_ID);
        validateMonitorArchive(archives);
      },
    );

    for (const pollutant of primaryPollutants) {
      await t.step(
        `GET  monitors/${pollutant}/current/`,
        async () => validateMonitorLatest(await getMonitors(pollutant)),
      );

      await t.step(
        `GET  monitors/${pollutant}/at/`,
        async () =>
          validateMonitorLatest(
            await getMonitors(pollutant, { timestamp: new Date() }),
          ),
      );

      await t.step(
        `GET  monitors/{MONITOR_ID}/entries/${pollutant}/`,
        async () =>
          validateMonitorEntries(
            await getMonitorEntries({
              entryType: pollutant,
              monitorId: EXISTING_MONITOR_ID,
            }),
          ),
      );

      await t.step("Generate CSV Download", async (t2) => {
        await t2.step(
          `Get  /api/2.0/monitors/{MONITOR_ID}/entries/${pollutant}/csv/`,
          async (t3) => {
            const url = getMonitorEntriesCSVUrl({
              entryType: pollutant,
              monitorId: EXISTING_MONITOR_ID,
            });

            assertEquals(url.origin, origin);
            assertEquals(
              url.pathname,
              `/api/2.0/monitors/${EXISTING_MONITOR_ID}/entries/${pollutant}/csv/`,
            );
            assertEquals(url.searchParams.has("timestamp__gte"), true);
            assertEquals(url.searchParams.has("timestamp__lte"), true);

            await t3.step("Fetch entries CSV", async () => {
              const response = await fetch(url);

              if (response.status !== 200) {
                fail("Monitor Entries CSV request failed");
              }
              const contentType = response.headers.get("content-type");
              const contentDispostion = response.headers.get(
                "content-disposition",
              );

              assertExists(contentType, "No Content-Type header");
              assertExists(contentDispostion, "No Content-Disposition header");

              assertEquals(contentType, "text/csv");
              assertEquals(
                contentDispostion.includes(`${EXISTING_MONITOR_ID}_export.csv`),
                true,
              );

              try {
                await response.text();
              } catch (error) {
                fail(
                  `Monitor Entries endpoint response is not text: ${
                    JSON.stringify(
                      error,
                      undefined,
                      2,
                    )
                  }`,
                );
              }
            });
          },
        );
      });

      await t.step(
        `GET  monitors/{MONITOR_ID}/entries/export/json/`,
        async () => {
          const startDate = "2024-01-01";
          const endDate = "2024-01-02";

          const records = await getMonitorEntriesExportJSON({
            monitorId: EXISTING_MONITOR_ID,
            startDate,
            endDate,
          });

          assertEquals(Array.isArray(records), true);
        },
      );

      await t.step(
        `Get  monitors/{MONITOR_ID}/entries/export/csv/`,
        async () => {
          const url = getMonitorEntriesExportCSVUrl({
            monitorId: EXISTING_MONITOR_ID,
            startDate: "2024-01-01",
            endDate: "2024-01-02",
          });

          assertEquals(url.origin, origin);
          assertEquals(
            url.pathname,
            `/api/2.0/monitors/${EXISTING_MONITOR_ID}/entries/export/csv/`,
          );

          const response = await fetch(url);

          if (response.status !== 200) {
            fail("Monitor Entries export CSV request failed");
          }
          assertEquals(response.headers.get("content-type"), "text/csv");
        },
      );

      // Summaries may legitimately come back empty: hourly/daily are filled in by a
      // periodic task over time, and monthly/quarterly/seasonal/yearly only exist
      // after that task's once-daily rollup (or a manual `rebuild_summaries` run) has
      // happened for this monitor. These steps only assert response shape, not content.
      await t.step(
        `GET  monitors/{MONITOR_ID}/summaries/${pollutant}/*`,
        async (t2) => {
          const year = new Date().getFullYear();

          await t2.step("hourly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesHourly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("daily", async () =>
            validateMonitorSummary(
              await getMonitorSummariesDaily({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("monthly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesMonthly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("quarterly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesQuarterly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("seasonal", async () =>
            validateMonitorSummary(
              await getMonitorSummariesSeasonal({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
                year,
              }),
            ));

          await t2.step("yearly", async () =>
            validateMonitorSummary(
              await getMonitorSummariesYearly({
                monitorId: EXISTING_MONITOR_ID,
                entryType: pollutant,
              }),
            ));
        },
      );
    }

    // Bulk summaries are paginated by row, not by monitor - a wide-open
    // date range/no region filter is enough to exercise the endpoint's
    // shape; the split/merge behavior itself is covered separately below
    // with fixture data, since the live server's page size (168 rows)
    // isn't practical to force through this integration test.
    await t.step(
      "GET  monitors/{entry_type}/summaries/daily",
      async () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 7);

        validateMonitorWithSummaries(
          await getMonitorSummariesBulkDaily({
            entryType: "pm25",
            start,
            end: today,
          }),
        );

        // An explicit processor is an exact match across all monitors,
        // rather than each monitor's default published series.
        validateMonitorWithSummaries(
          await getMonitorSummariesBulkDaily({
            entryType: "pm25",
            start,
            end: today,
            processor: "",
          }),
        );
      },
    );
  },
});

Deno.test({
  name: "mergeMonitorSummaryBulkPages",
  permissions: { net: false },
  fn() {
    const summary = (timestamp: string) => ({
      timestamp,
      entry_type: "pm25",
      resolution: "day",
      processor: "",
      count: 288,
      expected_count: 288,
      minimum: 2.1,
      maximum: 9.4,
      mean: 5.6,
      stddev: 1.2,
      p25: 4.5,
      p75: 6.7,
      is_complete: true,
    });

    const monitor = (
      id: string,
      summaries: ReturnType<typeof summary>[],
    ): MonitorWithSummaries => ({
      id,
      summaries,
    } as unknown as MonitorWithSummaries);

    // Simulates a monitor ("split-monitor") whose rows didn't fit on a single
    // page: it appears at the end of page 1 with a partial `summaries` array,
    // and again at the start of page 2 with the rest.
    const page1 = [
      monitor("whole-monitor", [summary("2024-01-01"), summary("2024-01-02")]),
      monitor("split-monitor", [summary("2024-01-01")]),
    ];
    const page2 = [
      monitor("split-monitor", [summary("2024-01-02"), summary("2024-01-03")]),
      monitor("another-monitor", [summary("2024-01-01")]),
    ];

    const merged = mergeMonitorSummaryBulkPages([page1, page2]);

    assertEquals(merged.map((m) => m.id), [
      "whole-monitor",
      "split-monitor",
      "another-monitor",
    ]);

    const splitMonitor = merged.find((m) => m.id === "split-monitor");
    assertExists(splitMonitor);
    assertEquals(
      splitMonitor.summaries.map((s) => s.timestamp),
      ["2024-01-01", "2024-01-02", "2024-01-03"],
    );
  },
});

Deno.test("Module: Monitors request params (stubbed fetch)", async (t) => {
  const emptyPage = () =>
    jsonResponse({ data: [], has_next_page: false, page: 1, pages: 1 });
  const zoned = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

  await t.step(
    "getMonitorEntries sends processor and stage when given",
    async () => {
      const stub = stubFetch(emptyPage);
      try {
        await getMonitorEntries({
          monitorId: "m",
          entryType: "pm25",
          processor: "PM25_UnitedStates",
          stage: "calibrated",
        });
      } finally {
        stub.restore();
      }

      assertEquals(stub.calls.length, 1);
      const params = stub.calls[0].url.searchParams;
      assertEquals(params.get("processor"), "PM25_UnitedStates");
      assertEquals(params.get("stage"), "calibrated");
    },
  );

  await t.step(
    "getMonitorEntries omits processor and stage otherwise",
    async () => {
      const stub = stubFetch(emptyPage);
      try {
        await getMonitorEntries({ monitorId: "m", entryType: "pm25" });
      } finally {
        stub.restore();
      }

      const params = stub.calls[0].url.searchParams;
      assertEquals(params.has("processor"), false);
      assertEquals(params.has("stage"), false);
    },
  );

  await t.step("getMonitorEntries sends Z bounds, even past now", async () => {
    const stub = stubFetch(emptyPage);
    try {
      await getMonitorEntries({
        monitorId: "m",
        entryType: "pm25",
        timestampGte: new Date("2026-10-22T07:00:00Z"),
        timestampLte: new Date(Date.now() + 6 * 3600_000),
      });
    } finally {
      stub.restore();
    }

    const params = stub.calls[0].url.searchParams;
    assertEquals(params.get("timestamp__gte"), "2026-10-22T07:00:00.000Z");
    assertMatch(params.get("timestamp__lte")!, zoned);
  });

  await t.step("getMonitors at/ sends a Z timestamp", async () => {
    const stub = stubFetch(() => jsonResponse({ data: [] }));
    try {
      await getMonitors("pm25", { timestamp: "2026-10-22T00:00:00-07:00" });
    } finally {
      stub.restore();
    }

    assertEquals(
      stub.calls[0].url.searchParams.get("timestamp"),
      "2026-10-22T07:00:00.000Z",
    );
  });

  await t.step("getMonitorEntriesCSVUrl sends Z bounds", () => {
    const url = getMonitorEntriesCSVUrl({
      monitorId: "m",
      entryType: "pm25",
      timestampGte: new Date("2026-10-22T12:00:00Z"),
      timestampLte: new Date("2026-10-22T12:01:00Z"),
    });

    assertEquals(
      url.searchParams.get("timestamp__gte"),
      "2026-10-22T07:00:00.000Z",
    );
    assertEquals(
      url.searchParams.get("timestamp__lte"),
      "2026-10-23T06:59:59.999Z",
    );
  });
});
