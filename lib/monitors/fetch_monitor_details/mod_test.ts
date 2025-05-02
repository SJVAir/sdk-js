import { assertEquals } from "@std/assert";
import { origin, setOrigin } from "$http";
import { getMonitorDetailsUrl } from "./request_builders.ts";
import { fetchMonitorDetailsHandler } from "./response_handlers.ts";
import { fetchMonitorDetails } from "./requests.ts";
import { getMonitorDetails } from "./mod.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

Deno.test({
  name: "Module: Fetch Monitor Details",
  permissions: { net: true },
  async fn(t) {
    const monitorId = "WcfzWer6Re6OW5SP0Gs52g";

    const buildUrlSuccess = await t.step(
      "Build fetch monitor details url",
      () => {
        const url = getMonitorDetailsUrl(monitorId);

        assertEquals(url.href, `${origin}/api/2.0/monitors/${monitorId}`);
      },
    );

    const fetchMonitorDetailsSuccess = await t.step({
      name: "Fetch raw response",
      ignore: !buildUrlSuccess,
      async fn(st) {
        const response = await fetchMonitorDetails(monitorId);
        assertEquals(response.status, 200);

        await st.step("Handle raw response", () => {
          const monitor = fetchMonitorDetailsHandler(response);
          assertEquals(monitor.id, monitorId);
        });
      },
    });

    await t.step({
      name: "Prebuild request and handler",
      ignore: !fetchMonitorDetailsSuccess,
      async fn() {
        const details = await getMonitorDetails(monitorId);
        assertEquals(details.id, monitorId);
      },
    });
  },
});
