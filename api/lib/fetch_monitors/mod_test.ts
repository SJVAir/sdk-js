import { assertEquals, assertGreater, fail } from "@std/assert";
import { validateMonitorSchema } from "../schemas/monitor.ts";
import { fetchMonitors, getMonitorsUrl } from "./mod.ts";

Deno.test({
  name: "Module: Fetch Monitors",
  permissions: { net: true },
  async fn(t) {
    await t.step("Build fetch monitors url", () => {
      const url = getMonitorsUrl();

      assertEquals(url.href, "https://www.sjvair.com/api/1.0/monitors/");
    });

    const fetchMonitorsSuccess = await t.step(
      "Fetch all monitors",
      async () => {
        const monitors = await fetchMonitors();
        assertGreater(monitors.length, 0);
      },
    );

    await t.step({
      name: "Validate monitor data",
      ignore: !fetchMonitorsSuccess,
      async fn() {
        const monitors = await fetchMonitors();

        validateMonitorSchema(monitors, (errors, monitor) => {
          console.error(errors);
          console.error(monitor);
          fail("Monitor data did not pass schema validation");
        });
      },
    });
  },
});
