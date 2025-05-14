import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { validateMonitorLatestSchema } from "../schemas/monitor.ts";
import { coordinates } from "../test_constants.ts";
import { validateClosestMonitors } from "./validation.ts";
import { getClosestMonitorUrl } from "./request_builders.ts";
import { fetchClosestMonitor } from "./requests.ts";
import type { MonitorEntries, MonitorLatest } from "../types.ts";
import { fetchClosestMonitorsHandler } from "./response_handlers.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const { longitude, latitude } = coordinates;

type MonitorLatestObject = MonitorLatest<keyof MonitorEntries>;

function validateMonitorLatest(
  monitors: MonitorLatestObject | Array<MonitorLatestObject>,
) {
  validateMonitorLatestSchema(
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
    await t.step(
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

                // This simulates the correct response form the endpoint
                //monitors.map((m) => {
                //  m.latest = {
                //    processor: "fake",
                //    sensor: "none",
                //    stage: "maybe?",
                //    timestamp: "nowish",
                //    value: "2.0",
                //  };
                //});

                assertEquals(Array.isArray(monitors), true);

                console.log(monitors);
                await t4.step("Validate closest monitor", () => {
                  const closestMonitor = validateClosestMonitors(monitors);

                  assertEquals(Array.isArray(closestMonitor), false);
                  // This simulates the correct response form the endpoint
                  //assertEquals(
                  //  closestMonitor.name,
                  //  "CCA Root Access Hackerspace #1",
                  //);
                  assertEquals(
                    closestMonitor.name,
                    "CCA Root Access Hackerspace #2",
                  );
                });
              },
            );
            // STILL NEED TO TEST PREBUILT FUNCTION
          },
        });
      },
    );
  },
});
