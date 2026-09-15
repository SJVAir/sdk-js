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
import { assertEquals, assertExists, fail } from "@std/assert";
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
        assertEquals(vozbox.entries.pm25.sensors, ["a", "b"]);
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

    await t.step("GET  monitors/ (aqlite monitor type)", async () => {
      const monitors = await getMonitorsList();
      const aqlite = monitors.find((monitor) => monitor.type === "aqlite");

      assertExists(aqlite, "No aqlite monitor found in monitors/ response");
      assertEquals(typeof aqlite.device_id, "string");
      assertEquals(["fem", "frm", "lcs"].includes(aqlite.grade), true);
    });

    await t.step(
      "GET  monitors/{MONITOR_ID}/",
      async () =>
        validateMonitorDetails(await getMonitorDetails(EXISTING_MONITOR_ID)),
    );

    await t.step(
      "GET  monitors/{ENTRY_TYPE}/closest/",
      async () =>
        validateClosestMonitor(
          await getClosestMonitors(
            "pm25",
            COORDINATES.latitude,
            COORDINATES.longitude,
          ),
        ),
    );

    await t.step(
      "GET  monitors/{ENTRY_TYPE}/closest/ (single monitor validation)",
      async () =>
        validateClosestMonitor(
          await getClosestMonitor(
            "pm25",
            COORDINATES.latitude,
            COORDINATES.longitude,
          ),
        ),
    );

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
  },
});
