import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { coordinates } from "../test_constants.ts";
import { getSimpleValidation } from "../../schema.ts";
import type { MonitorClosest } from "../types.ts";
import {
  fetchClosestMonitor,
  fetchClosestMonitorsHandler,
  getClosestMonitor,
  getClosestMonitorUrl,
  validateClosestMonitors,
} from "./mod.ts";
import { monitorClosestSchema } from "../schemas/monitor_data.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const { longitude, latitude } = coordinates;

function assertClosestMonitor(monitor: MonitorClosest) {
  assertEquals(Array.isArray(monitor), false);
  assertEquals(monitor.location, "outside");
  //assertEquals(
  //  monitor.name,
  //  "CCA Root Access Hackerspace #2",
  //);
}

const validateClosestMonitorSchema = getSimpleValidation(
  monitorClosestSchema,
  (error, monitor) => {
    console.error(error);
    console.error(monitor);
    fail("Monitor data did not pass schema validation");
  },
);

Deno.test({
  name: "Module: Fetch Closest Monitor",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch closest monitor request",
      async (t2) => {
        const canBuildUrl = await t2.step(
          "Get URL",
          () => {
            const url = getClosestMonitorUrl(
              "pm25",
              latitude,
              longitude,
            );

            assertEquals(url.origin, origin);
            assertEquals(
              url.pathname,
              "/api/2.0/monitors/pm25/closest/",
            );
            assertEquals(url.searchParams.has("latitude"), true);
            assertEquals(url.searchParams.has("longitude"), true);
          },
        );

        await t2.step({
          name: "Fetch raw response",
          ignore: !canBuildUrl,
          async fn(t3) {
            const response = await fetchClosestMonitor(
              "pm25",
              latitude,
              longitude,
            ).catch((err) => {
              console.error(err);
              fail("failed to fetch single monitor entries page");
            });

            assertEquals(response.status, 200);

            await t3.step(
              "Handle raw response",
              async (t4) => {
                const monitors = fetchClosestMonitorsHandler(response);

                assertEquals(Array.isArray(monitors), true);

                await t4.step("Validate closest monitor", () => {
                  const closestMonitor = validateClosestMonitors(monitors);

                  assertClosestMonitor(closestMonitor);
                  validateClosestMonitorSchema(closestMonitor);
                });
              },
            );
          },
        });
      },
    );

    await t.step({
      name: "Prebuilt request and handler",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch closest monitor",
          async (t3) => {
            const closestMonitor = await getClosestMonitor(
              "pm25",
              latitude,
              longitude,
            );

            assertClosestMonitor(closestMonitor);

            await t3.step(
              "Validate monitor data",
              () => validateClosestMonitorSchema(closestMonitor),
            );
          },
        );
      },
    });
  },
});
