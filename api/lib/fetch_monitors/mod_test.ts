import { assertEquals, assertGreater, fail } from "@std/assert";
import { validateMonitorSchema } from "../schemas/monitor.ts";
import type { MonitorData } from "../types.ts";
import { fetchClosestMonitor, getMonitorsUrl } from "./mod.ts";

Deno.test({
  name: "Module: Fetch Monitors",
  permissions: { net: true },
  async fn(t) {
    let monitors: Array<MonitorData>;

    await t.step("Build fetch monitors url", () => {
      const url = getMonitorsUrl();

      assertEquals(url.href, "https://www.sjvair.com/api/1.0/monitors/");
    });

    await t.step("Fetch all monitors", async () => {
      monitors = await fetchClosestMonitor();
      assertGreater(monitors.length, 0);
    });

    await t.step("Validate monitor data", () => {
      validateMonitorSchema(monitors, (errors, monitor) => {
        console.error(errors);
        console.error(monitor);
        fail("Monitor data did not pass schema validation");
      });
    });
  },
});
