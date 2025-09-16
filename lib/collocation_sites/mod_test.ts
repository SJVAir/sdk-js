import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { collocationSchema } from "./schema.ts";
import { getCollocationSites } from "./get_collocation_sites.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateCollocation = getSimpleValidationTest(collocationSchema);

Deno.test({
  name: "Module: Collocation Sites",
  permissions: { net: true },
  async fn(t) {
    await t.step(
      "GET  calibrations/",
      async () => validateCollocation(await getCollocationSites()),
    );
  },
});
