import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { getHMSFireById } from "./get_fire_by_id.ts";
import { getHMSFire } from "./get_fire.ts";
import { hmsFireSchema } from "./schema.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateHMSFireData = getSimpleValidationTest(hmsFireSchema);

Deno.test({
  name: "Module: Fetch HMS Fire",
  permissions: { net: true },
  async fn(t) {
    await t.step("GET  hms/fire/", async (t2) => {
      const fire = await getHMSFire();
      assertEquals(Array.isArray(fire), true);
      validateHMSFireData(fire);

      if (fire.length === 0) {
        console.warn(
          "No HMS fire events found. Skipping GET hms-fire/{id} test.",
        );
        return;
      }
      const fireEventTarget = fire[0];

      await t2.step(`GET hms/fire/${fireEventTarget.id}`, async () => {
        const fireEvent = await getHMSFireById(fireEventTarget.id);

        validateHMSFireData(fireEvent);
      });
    });
  },
});
