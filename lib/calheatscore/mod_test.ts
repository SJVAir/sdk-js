import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { scaleSchema } from "../meta/schemas/mod.ts";
import type { Scale } from "../meta/types.ts";
import fixture from "./fixtures/calheatscore_meta.json" with { type: "json" };
import { getCalHeatScoreMeta } from "./get_calheatscore_meta.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateScale = getSimpleValidationTest(scaleSchema);

Deno.test({
  name: "Module: CalHeatScore Meta",
  async fn(t) {
    await t.step("fixture scales match the schema", () => {
      const scale = fixture.data.scales["heat-score"] as unknown as Scale;
      validateScale(scale);
      assertEquals(scale.levels[3].color, "#c23a00");
    });

    await t.step("calls calheatscore/meta and unwraps the scales", async () => {
      const stub = stubFetch(() => jsonResponse(fixture));
      try {
        const meta = await getCalHeatScoreMeta();
        assertEquals(stub.calls[0].url.pathname, "/api/2.0/calheatscore/meta/");
        assertEquals(meta.scales["heat-score"].levels[3].color, "#c23a00");
      } finally {
        stub.restore();
      }
    });

    await t.step("GET  calheatscore/meta/", async () => {
      try {
        const meta = await getCalHeatScoreMeta();
        validateScale(meta.scales["heat-score"]);
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("calheatscore/meta/ unavailable; skipping.");
      }
    });
  },
});
