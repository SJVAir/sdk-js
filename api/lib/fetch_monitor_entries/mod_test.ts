import { assertEquals, assertGreater, fail } from "@std/assert";
import { fetchMonitorEntries, getMonitorEntriesUrl } from "./mod.ts";
import { validateMonitorEntrySchema } from "../schemas/monitor.ts";
import type { MonitorEntry } from "../types.ts";

async function getEntries(): Promise<Array<MonitorEntry>> {
  return await fetchMonitorEntries({
    monitorId: "xudEmbncQ7iqwy3sZ0jZvQ",
    fields: "pm25",
  }).catch((err) => {
    console.error(err);
    fail("Monitor entries request failed");
  });
}

Deno.test({
  name: "Module: Fetch Monitor Entries",
  permissions: { net: true },
  async fn(t) {
    await t.step("Build fetch monitor entries url", () => {
      const url = getMonitorEntriesUrl({
        monitorId: "xudEmbncQ7iqwy3sZ0jZvQ",
        fields: "pm25",
      });

      assertEquals(url.origin, "https://www.sjvair.com");
      assertEquals(
        url.pathname,
        "/api/1.0/monitors/xudEmbncQ7iqwy3sZ0jZvQ/entries/",
      );
      assertEquals(url.searchParams.has("fields"), true);
      assertEquals(url.searchParams.has("page"), true);
      assertEquals(url.searchParams.has("sensor"), true);
      assertEquals(url.searchParams.has("timestamp__gte"), true);
      assertEquals(url.searchParams.has("timestamp__lte"), true);
    });

    await t.step("Fetch monitor entries", async () => {
      const entries = await getEntries();
      assertGreater(entries.length, 0);
    });

    await t.step("Validate monitor data", async () => {
      const entries = await getEntries();
      validateMonitorEntrySchema(entries, (errors, entry) => {
        console.error(errors);
        console.error(entry);
        fail("Monitor entry did not pass schema validation");
      });
    });
  },
});
