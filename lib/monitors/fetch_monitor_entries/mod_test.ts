import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { validateMonitorEntryRequestResponseSchema } from "../schemas/monitor_entries_request_response.ts";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { getMonitorEntriesUrl } from "./request_builders.ts";
import { fetchMonitorEntriesPage } from "./requests.ts";
import type { MonitorDataField } from "../types.ts";
import type {
  MonitorEntryRequestConfig,
  MonitorEntryRequestResponse,
} from "./types.ts";
import { gatherMonitorEntries } from "./response_handlers.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const requestConfig: MonitorEntryRequestConfig = {
  monitorId: "HmeeUr66RpKHFx64nBV6hQ",
  field: DEFAULT_DISPLAY_FIELD,
};

//async function getEntries(): Promise<Array<MonitorEntry>> {
//  return await fetchMonitorEntries(requestConfig).catch((err) => {
//    console.error(err);
//    fail("Monitor entries request failed");
//  });
//}

//function validateEntries(entries: Array<MonitorEntry>) {
//  assertGreater(entries.length, 0);
//}

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
                //await t4.step(
                //  "Validate entries",
                //  () => validateEntries(),
                //);
              },
            });
          },
        });
      },
    );

    //const fetchentriesSuccess = await t.step({
    //  name: "Fetch all monitor entries",
    //  ignore: !fetchEntriesPageSuccess,
    //  async fn() {
    //    const entries = await getEntries();
    //    validateEntries(entries);
    //  },
    //});

    //await t.step({
    //  name: "Validate monitor data",
    //  ignore: !fetchentriesSuccess,
    //  async fn() {
    //    const entries = await getEntries();
    //    validateMonitorEntrySchema(entries, (errors, entry) => {
    //      console.error(errors);
    //      console.error(entry);
    //      fail("Monitor entry did not pass schema validation");
    //    });
    //  },
    //});
  },
});
