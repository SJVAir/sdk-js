import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { validateMonitorLatestSchema } from "../schemas/monitor.ts";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { getMonitorsLatestUrl } from "./request_builders.ts";
import { fetchMonitorsLatestHandler } from "./response_handlers.ts";
import { fetchMonitorsLatest } from "./requests.ts";
import { getMonitorsLatest } from "./mod.ts";
import type { MonitorEntries, MonitorLatest } from "../types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

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
  name: "Module: Fetch Monitors Latest",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch monitors latest request",
      async (t2) => {
        const canBuildUrl = await t2.step("Get URL", () => {
          const url = getMonitorsLatestUrl(DEFAULT_DISPLAY_FIELD);

          assertEquals(
            url.href,
            `${origin}/api/2.0/monitors/${DEFAULT_DISPLAY_FIELD}/current/`,
          );
        });

        await t2.step({
          name: "Fetch raw response",
          ignore: !canBuildUrl,
          async fn(t3) {
            const rawResponse = await fetchMonitorsLatest("particulates");

            assertEquals(rawResponse.status, 200);

            await t3.step(
              "Handle raw response",
              async (t4) => {
                const monitors = fetchMonitorsLatestHandler(rawResponse);

                assertEquals(Array.isArray(monitors), true);

                await t4.step(
                  "Validate monitor latest data",
                  () => validateMonitorLatest(monitors),
                );
              },
            );
          },
        });
      },
    );

    await t.step({
      name: "Prebuilt fetch monitors latest request",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch latest monitor readings",
          async (t3) => {
            const monitors = await getMonitorsLatest()
              .catch((err) => {
                console.error("Error(fetch all monitors):", err);
                fail("Prebuilt fetchMonitorsLatest request failed!");
              });

            assertEquals(Array.isArray(monitors), true);

            await t3.step(
              "Validate monitor latest data",
              () => validateMonitorLatest(monitors),
            );
          },
        );
      },
    });
  },
});
