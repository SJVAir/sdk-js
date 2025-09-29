import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { getHMSSmokeOngoing } from "./get_smoke_ongoing.ts";
import { getHMSSmokeById } from "./get_smoke_by_id.ts";
import { getHMSSmoke } from "./get_smoke.ts";
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
      async (t2) => {
        const smoke = await getHMSSmoke();
        assertEquals(Array.isArray(smoke), true);
        validateHMSSmokeData(smoke);

        const smokeEventTarget = smoke[0];

        await t2.step(`GET hms-smoke/${smokeEventTarget.id}`, async () => {
          const smokeEvent = await getHMSSmokeById(smokeEventTarget.id);

          validateHMSSmokeData(smokeEvent);
        });
      },
    );

    await t.step(
      "GET  hms-smoke/ongoing/",
      async () => {
        const smoke = await getHMSSmokeOngoing();
        assertEquals(Array.isArray(smoke), true);
        validateHMSSmokeData(smoke);
      },
    );
  },
});
