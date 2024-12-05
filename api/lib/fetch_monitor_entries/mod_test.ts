import { assertEquals, assertGreater, fail } from "@std/assert";
import {
  fetchMonitorEntries,
  fetchMonitorEntriesPage,
  gatherMonitorEntries,
  getMonitorEntriesUrl,
  type MonitorEntryRequestConfig,
} from "./mod.ts";
import { validateMonitorEntrySchema } from "../schemas/monitor.ts";
import { validateMonitorEntryRequestResponse } from "../schemas/monitor_entries_request_response.ts";
import type { MonitorEntry } from "../types.ts";

const requestConfig: MonitorEntryRequestConfig = {
  monitorId: "xudEmbncQ7iqwy3sZ0jZvQ",
  fields: "pm25",
};

async function getEntries(): Promise<Array<MonitorEntry>> {
  return await fetchMonitorEntries(requestConfig).catch((err) => {
    console.error(err);
    fail("Monitor entries request failed");
  });
}

function validateEntries(entries: Array<MonitorEntry>) {
  assertGreater(entries.length, 0);
}

Deno.test({
  name: "Module: Fetch Monitor Entries",
  permissions: { net: true },
  async fn(t) {
    await t.step("Build fetch monitor entries url", () => {
      const url = getMonitorEntriesUrl(requestConfig);

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

    const fetchEntriesPageSuccess = await t.step(
      "Fetch single monitor entries page",
      async () => {
        await fetchMonitorEntriesPage(requestConfig)
          .catch((err) => {
            console.error(err);
            fail("failed to fetch single monitor entries page");
          });
      },
    );

    await t.step({
      name: "Validate single entries page",
      ignore: !fetchEntriesPageSuccess,
      async fn() {
        const entriesResponse = await fetchMonitorEntriesPage(requestConfig);

        validateMonitorEntryRequestResponse(entriesResponse, (errors, data) => {
          console.error(errors);
          console.error(data);
          fail("Monitor entries page did not pass schema validation");
        });
      },
    });

    await t.step({
      name: "Aggregate monitor entries from custom request",
      ignore: !fetchEntriesPageSuccess,
      async fn() {
        const entries = await gatherMonitorEntries(
          requestConfig,
          fetchMonitorEntriesPage,
        );
        validateEntries(entries);
      },
    });

    const fetchentriesSuccess = await t.step({
      name: "Fetch all monitor entries",
      ignore: !fetchEntriesPageSuccess,
      async fn() {
        const entries = await getEntries();
        validateEntries(entries);
      },
    });

    await t.step({
      name: "Validate monitor data",
      ignore: !fetchentriesSuccess,
      async fn() {
        const entries = await getEntries();
        validateMonitorEntrySchema(entries, (errors, entry) => {
          console.error(errors);
          console.error(entry);
          fail("Monitor entry did not pass schema validation");
        });
      },
    });
  },
});
