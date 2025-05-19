import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import {
  validateMonitorEntriesCollection,
  validateMonitorEntryRequestResponseSchema,
} from "../schemas/monitor_entries_request_response.ts";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { monitorId } from "../test_constants.ts";
import { getMonitorEntriesUrl } from "./request_builders.ts";
import { gatherMonitorEntries } from "./response_handlers.ts";
import { fetchMonitorEntriesPage } from "./requests.ts";
import type { MonitorDataField } from "../types.ts";
import type {
  MonitorEntryRequestConfig,
  MonitorEntryRequestResponse,
} from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const requestConfig: MonitorEntryRequestConfig = {
  monitorId,
  field: DEFAULT_DISPLAY_FIELD,
};

function validateMonitorEntryRequestResponse(
  response: MonitorEntryRequestResponse<MonitorDataField>,
) {
  validateMonitorEntryRequestResponseSchema(response, (errors, data) => {
    console.error(errors);
    console.error(data);
    fail("Monitor entries page did not pass schema validation");
  });
}

Deno.test({
  name: "Module: Fetch Monitor Entries",
  permissions: { net: true },
  async fn(t) {
    await t.step(
      "Build fetch monitor entries request",
      async (t2) => {
        const canBuildUrl = await t2.step(
          "Get URL",
          () => {
            const url = getMonitorEntriesUrl(requestConfig);

            assertEquals(url.origin, origin);
            assertEquals(
              url.pathname,
              `/api/2.0/monitors/${requestConfig.monitorId}/entries/${DEFAULT_DISPLAY_FIELD}/`,
            );
            assertEquals(url.searchParams.has("page"), true);
            assertEquals(url.searchParams.has("sensor"), true);
            assertEquals(url.searchParams.has("timestamp__gte"), true);
            assertEquals(url.searchParams.has("timestamp__lte"), true);
          },
        );

        await t2.step({
          name: "Fetch single monitor entries page",
          ignore: !canBuildUrl,
          async fn(t3) {
            const response = await fetchMonitorEntriesPage(requestConfig)
              .catch((err) => {
                console.error(err);
                fail("failed to fetch single monitor entries page");
              });

            assertEquals(response.status, 200);

            const validFirstPage = await t3.step(
              "Validate single entries page",
              () => validateMonitorEntryRequestResponse(response.body),
            );

            await t3.step({
              name: "Aggregate monitor entries from custom request",
              ignore: !validFirstPage,
              async fn(t4) {
                const entries = await gatherMonitorEntries(
                  requestConfig,
                  fetchMonitorEntriesPage,
                );

                assertEquals(Array.isArray(entries), true);

                // Left off here
                await t4.step(
                  "Validate entries",
                  () =>
                    validateMonitorEntriesCollection(
                      entries,
                      (errors, data) => {
                        console.error(errors);
                        console.error(data);
                        fail(
                          "Monitor entries array did not pass schema validation",
                        );
                      },
                    ),
                );
              },
            });
          },
        });
      },
    );
  },
});
