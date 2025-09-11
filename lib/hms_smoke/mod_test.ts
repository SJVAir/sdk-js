import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { getHMSSmokeOngoing } from "./fetch_smoke_ongoing.ts";
import { getHMSSmoke } from "./fetch_smoke.ts";
import { hmsSmokeSchema } from "./schema.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateHMSSmokeData = getSimpleValidationTest(hmsSmokeSchema);

Deno.test({
  name: "Module: Fetch HMS Smoke",
  permissions: { net: true },
  async fn(t) {
    await t.step(
      "GET  hms-smoke/",
      async () => {
        const smoke = await getHMSSmoke();
        assertEquals(Array.isArray(smoke), true);
        validateHMSSmokeData(smoke);
      },
    );
  },
});
