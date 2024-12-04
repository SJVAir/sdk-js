import { assertEquals, fail } from "@std/assert";
import { fetchMonitorDetails, getMonitorDetailsUrl } from "./mod.ts";
import { validateMonitorSchema } from "../schemas/monitor.ts";
import type { MonitorData } from "../types.ts";

Deno.test({
  name: "Module: Fetch Monitor Details",
  permissions: { net: true },
  async fn(t) {
    const monitorId = "xudEmbncQ7iqwy3sZ0jZvQ";

    async function getDetails(): Promise<MonitorData> {
      return await fetchMonitorDetails(monitorId)
        .catch((err) => {
          console.error(err);
          fail("Monitor entries request failed");
        });
    }

    await t.step("Build fetch monitor details url", () => {
      const url = getMonitorDetailsUrl(monitorId);

      assertEquals(url.origin, "https://www.sjvair.com");
      assertEquals(
        url.pathname,
        "/api/1.0/monitors/xudEmbncQ7iqwy3sZ0jZvQ/",
      );
    });

    await t.step("Fetch monitor details", async () => {
      const monitor = await getDetails();
      assertEquals(monitor.name, "CCA Root Access Hackerspace #2");
    });

    await t.step("Validate monitor data", async () => {
      const details = await getDetails();
      validateMonitorSchema(details, (errors, entry) => {
        console.error(errors);
        console.error(entry);
        fail("Monitor entry did not pass schema validation");
      });
    });
  },
});
