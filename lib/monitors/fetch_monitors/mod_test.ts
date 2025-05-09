import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { validateMonitorDataSchema } from "../schemas/monitor.ts";
import { getMonitorsUrl } from "./request_builders.ts";
import { fetchMonitorsHandler } from "./response_handlers.ts";
import { fetchMonitors } from "./requests.ts";
import { getMonitors } from "./mod.ts";
import type { MonitorData } from "../types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

function validateMonitorData(monitors: Array<MonitorData>) {
  validateMonitorDataSchema(monitors, (errors, monitor) => {
    console.error(errors);
    console.error(monitor);
    fail("Monitor data did not pass schema validation");
  });
}

Deno.test({
  name: "Module: Fetch Monitors",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step("Build fetch monitors request", async (t2) => {
      const canBuildUrl = await t2.step("Get URL", () => {
        const url = getMonitorsUrl();

        assertEquals(url.href, `${origin}/api/2.0/monitors/`);
      });

      await t2.step({
        name: "Fetch raw response",
        ignore: !canBuildUrl,
        async fn(t3) {
          const rawResponse = await fetchMonitors();

          assertEquals(rawResponse.status, 200);

          await t3.step(
            "Handle raw response",
            async (t4) => {
              const monitors = fetchMonitorsHandler(rawResponse);

              assertEquals(Array.isArray(monitors), true);

              await t4.step(
                "Validate monitor data",
                () => validateMonitorData(monitors),
              );
            },
          );
        },
      });
    });

    await t.step({
      name: "Prebuilt fetch monitors request",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch all monitors",
          async (t3) => {
            const monitors = await getMonitors()
              .catch((err) => {
                console.error("Error(fetch all monitors):", err);
                fail(
                  "Prebuilt fetchMonitors request failed! Error data should be displayed",
                );
              });
            assertEquals(Array.isArray(monitors), true);

            await t3.step(
              "Validate monitor data",
              () => validateMonitorData(monitors),
            );
          },
        );
      },
    });
  },
});
