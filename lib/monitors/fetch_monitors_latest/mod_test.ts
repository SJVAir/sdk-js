import { assertEquals, assertGreater, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { validateMonitorDetailsSchema } from "../schemas/monitor.ts";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { getMonitorsLatestUrl } from "./request_builders.ts";
import { fetchMonitorsLatestHandler } from "./response_handlers.ts";
import { fetchMonitorsLatest } from "./requests.ts";
import { getMonitorsLatest } from "./mod.ts";
import type { MonitorDetails } from "../types.ts";
import type { FetchMonitorsLatestResponse } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

Deno.test({
  name: "Module: Fetch Monitors Latest",
  permissions: { net: true },
  async fn(t) {
    await t.step("Build fetch monitors latest request", async (st) => {
      let rawResponse: FetchMonitorsLatestResponse<
        typeof DEFAULT_DISPLAY_FIELD
      >;

      await st.step("Get URL", () => {
        const url = getMonitorsLatestUrl(DEFAULT_DISPLAY_FIELD);

        assertEquals(
          url.href,
          `${origin}/api/2.0/monitors/${DEFAULT_DISPLAY_FIELD}/current/`,
        );
      });

      const rawResponseSuccess = await st.step(
        "Fetch raw response",
        async () => {
          rawResponse = await fetchMonitorsLatest(DEFAULT_DISPLAY_FIELD);

          assertEquals(rawResponse.status, 200);
        },
      );

      await st.step({
        name: "Handle raw response",
        ignore: !rawResponseSuccess,
        fn() {
          const monitors = fetchMonitorsLatestHandler(rawResponse);

          assertEquals(Array.isArray(monitors), true);
        },
      });
    });

    await t.step("Prebuilt fetch monitors latest request", async (st) => {
      let monitors: Awaited<ReturnType<typeof getMonitorsLatest>>;

      const fetchMonitorsSuccess = await st.step(
        "Fetch all monitors",
        async () => {
          monitors = await getMonitorsLatest()
            .catch((err) => {
              console.error("Error(fetch all monitors):", err);
              fail("Prebuilt fetchMonitorsLatest request failed!");
            });
          assertGreater(monitors.length, 0);
        },
      );

      await st.step({
        name: "Validate monitor latest data",
        ignore: !fetchMonitorsSuccess,
        fn() {
          validateMonitorDetailsSchema(
            monitors as Array<MonitorDetails>,
            (errors, monitor) => {
              console.error(errors);
              console.error(monitor);
              fail("Monitor data did not pass schema validation");
            },
          );
        },
      });
    });
  },
});
