import { setOrigin } from "$http";
import { coordinates, getSimpleValidationTest } from "$testing";
import {
  monitorClosestSchema,
  monitorDataSchema,
  monitorDetailsSchema,
  monitorLatestSchema,
  someMonitorEntrySchema,
} from "./schemas/mod.ts";
import { getMonitors } from "./fetch_monitors.ts";
import {
  getClosestMonitor,
  getClosestMonitors,
} from "./fetch_closest_monitor.ts";
import { getMonitorsLatest } from "./fetch_monitors_latest.ts";
import { getMonitorDetails } from "./fetch_monitor_details.ts";
import type { MonitorEntryType } from "./types.ts";
import { getMonitorEntries } from "./fetch_monitor_entries.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const primaryPollutants: Array<MonitorEntryType> = ["pm25", "o3"];

const validateMonitorData = getSimpleValidationTest(monitorDataSchema);
const validateMonitorLatest = getSimpleValidationTest(monitorLatestSchema);
const validateMonitorDetails = getSimpleValidationTest(monitorDetailsSchema);
const validateClosestMonitor = getSimpleValidationTest(monitorClosestSchema);
const validateMonitorEntries = getSimpleValidationTest(someMonitorEntrySchema);

Deno.test({
  name: "Module: Monitors Endpoints",
  permissions: { net: true },
  async fn(t) {
    let monitorId: string;

    await t.step(
      "GET  monitors/",
      async () => {
        const monitors = await getMonitors();

        validateMonitorData(monitors);

        monitorId = monitors[0].id;
      },
    );

    for (const pollutant of primaryPollutants) {
      await t.step(
        `GET  monitors/${pollutant}/current/`,
        async () => {
          const monitors = await getMonitorsLatest(pollutant);
          validateMonitorLatest(monitors);

          monitorId = monitors[0]?.id ?? monitorId;
        },
      );

      await t.step({
        name: `GET  monitors/{MONITOR_ID}/entries/${pollutant}/`,
        ignore: monitorId! === undefined,
        fn: async () =>
          validateMonitorEntries(
            await getMonitorEntries({
              entryType: pollutant,
              monitorId,
            }),
          ),
      });
    }

    await t.step({
      name: "GET  monitors/{MONITOR_ID}/",
      ignore: monitorId! === undefined,
      fn: async () =>
        validateMonitorDetails(await getMonitorDetails(monitorId)),
    });

    await t.step(
      "GET  monitors/{ENTRY_TYPE}/closest/",
      async () =>
        validateClosestMonitor(
          await getClosestMonitors(
            "pm25",
            coordinates.latitude,
            coordinates.longitude,
          ),
        ),
    );

    await t.step(
      "GET  monitors/{ENTRY_TYPE}/closest/ (single monitor validation)",
      async () =>
        validateClosestMonitor(
          await getClosestMonitor(
            "pm25",
            coordinates.latitude,
            coordinates.longitude,
          ),
        ),
    );

  },
});
