import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { validateMonitorClosestSchema } from "../schemas/monitor.ts";
import { coordinates } from "../test_constants.ts";
import { validateClosestMonitors } from "./validation.ts";
import { getClosestMonitorUrl } from "./request_builders.ts";
import { fetchClosestMonitor } from "./requests.ts";
import type { MonitorClosest, MonitorEntries } from "../types.ts";
import { fetchClosestMonitorsHandler } from "./response_handlers.ts";
import { getClosestMonitor } from "./mod.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const { longitude, latitude } = coordinates;

type MonitorClosestObject = MonitorClosest<keyof MonitorEntries>;

function assertClosestMonitor(monitor: MonitorClosestObject) {
  assertEquals(Array.isArray(monitor), false);
  assertEquals(monitor.location, "outside");
  assertEquals(
    monitor.name,
    "CCA Root Access Hackerspace #2",
  );
}

function validateClosestMonitorSchema(
  monitors: MonitorClosestObject | Array<MonitorClosestObject>,
) {
  validateMonitorClosestSchema(
    monitors,
    (errors, monitor) => {
      console.error(errors);
      console.error(monitor);
      fail("Monitor data did not pass schema validation");
    },
  );
}

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
              DEFAULT_DISPLAY_FIELD,
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
              DEFAULT_DISPLAY_FIELD,
              latitude,
              longitude,
            )
              .catch((err) => {
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
            const closestMonitor = await getClosestMonitor(latitude, longitude);

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
