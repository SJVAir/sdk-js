import { assertEquals, assertGreater, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { validateMonitorDataSchema } from "../schemas/monitor.ts";
import { getMonitorsUrl } from "./request_builders.ts";
import { fetchMonitorsHandler } from "./response_handlers.ts";
import { fetchMonitors } from "./requests.ts";
import { getMonitors } from "./mod.ts";
import type { FetchMonitorsResponse } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

Deno.test({
  name: "Module: Fetch Monitors",
  permissions: { net: true },
  async fn(t) {
    await t.step("Build fetch monitors request", async (st) => {
      let rawResponse: FetchMonitorsResponse;

      await st.step("Get URL", () => {
        const url = getMonitorsUrl();

        assertEquals(url.href, `${origin}/api/2.0/monitors/`);
      });

      const rawResponseSuccess = await st.step(
        "Fetch raw response",
        async () => {
          rawResponse = await fetchMonitors();

          assertEquals(rawResponse.status, 200);
        },
      );

      await st.step({
        name: "Handle raw response",
        ignore: !rawResponseSuccess,
        fn() {
          const monitors = fetchMonitorsHandler(rawResponse);

          assertEquals(Array.isArray(monitors), true);
        },
      });
    });

    await t.step("Prebuilt fetch monitors request", async (st) => {
      let monitors: Awaited<ReturnType<typeof getMonitors>>;

      const fetchMonitorsSuccess = await st.step(
        "Fetch all monitors",
        async () => {
          monitors = await getMonitors()
            .catch((err) => {
              console.error("Error(fetch all monitors):", err);
              fail(
                "Prebuilt fetchMonitors request failed! Error data should be displayed",
              );
            });
          assertGreater(monitors.length, 0);
        },
      );

      await st.step({
        name: "Validate monitor data",
        ignore: !fetchMonitorsSuccess,
        fn() {
          validateMonitorDataSchema(monitors, (errors, monitor) => {
            console.error(errors);
            console.error(monitor);
            fail("Monitor data did not pass schema validation");
          });
        },
      });
    });
  },
});
