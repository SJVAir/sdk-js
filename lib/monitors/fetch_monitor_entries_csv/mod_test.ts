import { assertEquals, assertExists, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { monitorId } from "$testing";
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
    await t.step(
      "Build fetch monitor entries request",
      async (t2) => {
        await t2.step(
          "Get URL",
          async (t3) => {
            const url = getMonitorEntriesCSVUrl(requestConfig);

            assertEquals(url.origin, origin);
            assertEquals(
              url.pathname,
              `/api/2.0/monitors/${requestConfig.monitorId}/entries/${pollutant}/csv/`,
            );
            assertEquals(url.searchParams.has("timestamp__gte"), true);
            assertEquals(url.searchParams.has("timestamp__lte"), true);

            await t3.step(
              "Fetch entries CSV",
              async () => {
                const response = await fetch(url);

                if (response.status !== 200) {
                  fail("Monitor Entries CSV request failed");
                }
                const contentType = response.headers.get("content-type");
                const contentDispostion = response.headers.get(
                  "content-disposition",
                );

                assertExists(contentType, "No Content-Type header");
                assertExists(
                  contentDispostion,
                  "No Content-Disposition header",
                );

                assertEquals(contentType, "text/csv");
                assertEquals(
                  contentDispostion.includes(
                    `${requestConfig.monitorId}_export.csv`,
                  ),
                  true,
                );

                try {
                  await response.text();
                } catch (error) {
                  console.log(
                    "Monitor Entries endpoint response is not text:",
                    error,
                  );
                }
              },
            );
          },
        );
      },
    );
  },
});
