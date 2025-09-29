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
  monitorLatestSchema,
  someMonitorEntrySchema,
} from "./schemas/mod.ts";
import { getMonitors } from "./get_monitors.ts";
import {
  getClosestMonitor,
  getClosestMonitors,
} from "./get_closest_monitor.ts";
import { getMonitorsLatest } from "./get_monitors_latest.ts";
import { getMonitorDetails } from "./get_monitor_details.ts";
import type { MonitorEntryType } from "./types.ts";
import { getMonitorEntries } from "./get_monitor_entries.ts";
import { assertEquals, assertExists, fail } from "@std/assert";
import { getMonitorEntriesCSVUrl } from "./get_monitor_entries_csv.ts";
import { getMonitorsMeta } from "./get_monitors_meta.ts";
import { sjvairMonitorsMetaSchema } from "./schemas/monitors_meta.ts";
import {
  getAllMonitorArchives,
  getMonitorArchivePage,
} from "./get_monitor_archives.ts";

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

Deno.test({
  name: "Module: Monitors Endpoints",
  permissions: { net: true },
  async fn(t) {
    await t.step(
      "GET   monitors/meta",
      async () => validateMonitorsMeta(await getMonitorsMeta()),
    );

    await t.step(
      "GET  monitors/",
      async () => validateMonitorData(await getMonitors()),
    );

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

    for (const pollutant of primaryPollutants) {
      await t.step(
        `GET  monitors/${pollutant}/current/`,
        async () => validateMonitorLatest(await getMonitorsLatest(pollutant)),
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

      await t.step(
        "Generate CSV Download",
        async (t2) => {
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

              await t3.step(
                "Fetch entries CSV",
                async () => {
                  const response = await fetch(url);

                  if (response.status !== 200) {
                    fail("Monitor Entries CSV request failed");
                  }
                  const contentType = response.headers.get("content-type");
                  const contentDispostion = response.headers.get(
                    "content-disposition",
                  );

                  assertExists(contentType, "No Content-Type header");
                  assertExists(
                    contentDispostion,
                    "No Content-Disposition header",
                  );

                  assertEquals(contentType, "text/csv");
                  assertEquals(
                    contentDispostion.includes(
                      `${EXISTING_MONITOR_ID}_export.csv`,
                    ),
                    true,
                  );

                  try {
                    await response.text();
                  } catch (error) {
                    fail(
                      `Monitor Entries endpoint response is not text: ${
                        JSON.stringify(error, undefined, 2)
                      }`,
                    );
                  }
                },
              );
            },
          );
        },
      );
    }
  },
});
