import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { monitorId } from "../test_constants.ts";
import {
  getMonitorEntriesCSVUrl,
  type MonitorEntryCSVRequestConfig,
} from "./mod.ts";
import type { MonitorEntryType } from "../types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const pollutant: MonitorEntryType = "pm25";
const requestConfig: MonitorEntryCSVRequestConfig = {
  monitorId,
  field: pollutant,
};

Deno.test({
  name: "Module: Fetch Monitor Entries CSV",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch monitor entries request",
      async (t2) => {
        const canBuildUrl = await t2.step(
          "Get URL",
          () => {
            const url = getMonitorEntriesCSVUrl(requestConfig);

            assertEquals(url.origin, origin);
            assertEquals(
              url.pathname,
              `/api/2.0/monitors/${requestConfig.monitorId}/entries/${pollutant}/csv/`,
            );
            assertEquals(url.searchParams.has("timestamp__gte"), true);
            assertEquals(url.searchParams.has("timestamp__lte"), true);
          },
        );

        await t2.step({
          name: "Fetch single monitor entries page",
          ignore: !canBuildUrl,
          async fn(t3) {
            const response = await fetch(requestConfig)
              .catch((err) => {
                console.error(err);
                fail("failed to fetch single monitor entries page");
              });

            assertEquals(response.status, 200);

            await t3.step(
              "Validate monitor entries",
              () => validateMonitorEntries(response.body.data),
            );
          },
        });
      },
    );

    await t.step({
      name: "Prebuilt request and handler",
      ignore: !success,
      async fn(t2) {
        await t2.step(
          "Get monitor entries",
          async (t3) => {
            const entries = await getMonitorEntries(requestConfig);

            assertEquals(Array.isArray(entries), true);

            await t3.step(
              "Validate monitor entries",
              () => validateMonitorEntries(entries),
            );
          },
        );
      },
    });
  },
});
