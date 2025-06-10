import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { validateMonitorLatestSchema } from "../schemas/monitor.ts";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import {
  fetchMonitorsLatest,
  getMonitorsLatest,
  getMonitorsLatestUrl,
} from "./mod.ts";
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
            url.origin + url.pathname,
            `${origin}/api/2.0/monitors/${DEFAULT_DISPLAY_FIELD}/current/`,
          );
        });

        await t2.step({
          name: "Fetch raw response",
          ignore: !canBuildUrl,
          async fn(t3) {
            const rawResponse = await fetchMonitorsLatest(
              DEFAULT_DISPLAY_FIELD,
            );

            assertEquals(rawResponse.status, 200);
            assertEquals(Array.isArray(rawResponse.body.data), true);

            await t3.step(
              "Validate monitor latest data",
              () => validateMonitorLatest(rawResponse.body.data),
            );
          },
        });
      },
    );

    await t.step({
      name: "Prebuilt, generic, fetch monitors latest request",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch latest monitor readings",
          async (t3) => {
            const monitors = await getMonitorsLatest(DEFAULT_DISPLAY_FIELD)
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

    await t.step({
      name: "Prebuilt, default, fetch monitors latest request",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Fetch latest monitor readings",
          async (t3) => {
            const monitors = await getMonitorsLatest(DEFAULT_DISPLAY_FIELD)
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
