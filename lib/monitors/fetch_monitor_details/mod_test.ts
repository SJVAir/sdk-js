import { assertEquals } from "@std/assert";
import { origin, setOrigin } from "$http";
import { monitorDetailsSchema } from "../schemas/monitor_data.ts";
import { monitorId } from "../test_constants.ts";
import {
  fetchMonitorDetails,
  fetchMonitorDetailsHandler,
  getMonitorDetails,
  getMonitorDetailsUrl,
} from "./mod.ts";
import { getSimpleValidationTest } from "../../testing.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateMonitorDetails = getSimpleValidationTest(monitorDetailsSchema);

Deno.test({
  name: "Module: Fetch Monitor Details",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch monitor details request",
      async (t2) => {
        const canBuildUrl = await t2.step(
          "Get URL",
          () => {
            const url = getMonitorDetailsUrl(monitorId);

            assertEquals(url.href, `${origin}/api/2.0/monitors/${monitorId}/`);
          },
        );

        await t2.step({
          name: "Fetch raw response",
          ignore: !canBuildUrl,
          async fn(t3) {
            const response = await fetchMonitorDetails(monitorId);
            assertEquals(response.status, 200);

            await t3.step(
              "Handle raw response",
              async (t4) => {
                const details = fetchMonitorDetailsHandler(response);

                await t4.step(
                  "Validate monitor data",
                  () => validateMonitorDetails(details),
                );

                assertEquals(details.id, monitorId);
              },
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
          "Fetch monitor details",
          async (t3) => {
            const details = await getMonitorDetails(monitorId);

            await t3.step(
              "Validate monitor data",
              () => validateMonitorDetails(details),
            );

            assertEquals(details.id, monitorId);
          },
        );
      },
    });
  },
});
