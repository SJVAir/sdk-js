import { assertEquals, fail } from "@std/assert";
import { origin, setOrigin } from "$http";
import { getMonitorDetailsUrl } from "./request_builders.ts";
import { fetchMonitorDetailsHandler } from "./response_handlers.ts";
import { fetchMonitorDetails } from "./requests.ts";
import { getMonitorDetails } from "./mod.ts";
import { validateMonitorDetailsSchema } from "../schemas/monitor.ts";
import type { MonitorDetails } from "../types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const monitorId = "HmeeUr66RpKHFx64nBV6hQ";

function validateMonitorDetails(
  details: MonitorDetails | Array<MonitorDetails>,
) {
  validateMonitorDetailsSchema(details, (errors, monitor) => {
    console.error(errors);
    console.error(monitor);
    fail("Monitor data did not pass schema validation");
  });
}

Deno.test({
  name: "Module: Fetch Monitor Details",
  permissions: { net: true },
  async fn(t) {
    const success = await t.step(
      "Build fetch monitor details request",
      async (t2) => {
        const buildUrlSuccess = await t2.step(
          "Build fetch monitor details url",
          () => {
            const url = getMonitorDetailsUrl(monitorId);

            assertEquals(url.href, `${origin}/api/2.0/monitors/${monitorId}/`);
          },
        );

        await t2.step({
          name: "Fetch raw response",
          ignore: !buildUrlSuccess,
          async fn(t3) {
            const response = await fetchMonitorDetails(monitorId);
            assertEquals(response.status, 200);

            await t3.step("Handle raw response", () => {
              const details = fetchMonitorDetailsHandler(response);
              validateMonitorDetails(details);
              assertEquals(details.id, monitorId);
            });
          },
        });
      },
    );

    await t.step({
      name: "Prebuild request and handler",
      ignore: !success,
      async fn() {
        const details = await getMonitorDetails(monitorId);
        validateMonitorDetails(details);
        assertEquals(details.id, monitorId);
      },
    });
  },
});
