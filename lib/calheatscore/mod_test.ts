import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { scaleSchema } from "../meta/schemas/mod.ts";
import fixture from "./fixtures/calheatscore_meta.json" with { type: "json" };
import { getCalHeatScoreMeta } from "./get_calheatscore_meta.ts";
import { calHeatScoreMetaSchema } from "./schemas/mod.ts";
import type { CalHeatScoreMeta } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateScale = getSimpleValidationTest(scaleSchema);
const validateMeta = getSimpleValidationTest(calHeatScoreMetaSchema);

// JSON imports widen string literals, so state the shape the schema will check.
const data = fixture.data as unknown as CalHeatScoreMeta;

Deno.test({
  name: "Module: CalHeatScore Meta",
  async fn(t) {
    await t.step("fixture scales match the schema", () => {
      validateMeta(data);
      const scale = data.scales["heat-score"];
      validateScale(scale);
      assertEquals(
        scale.levels.find((l) => l.key === "high")?.color,
        "#c23a00",
      );
    });

    await t.step("calls calheatscore/meta and unwraps the scales", async () => {
      const stub = stubFetch(() => jsonResponse(fixture));
      try {
        const meta = await getCalHeatScoreMeta();
        assertEquals(stub.calls[0].url.pathname, "/api/2.0/calheatscore/meta/");
        assertEquals(
          meta.scales["heat-score"].levels.find((l) => l.key === "high")?.color,
          "#c23a00",
        );
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
