import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { scaleSchema } from "../meta/schemas/mod.ts";
import fixture from "./fixtures/hms_meta.json" with { type: "json" };
import { getHmsMeta } from "./get_hms_meta.ts";
import { hmsMetaSchema } from "./schemas/mod.ts";
import type { HmsMeta } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateScale = getSimpleValidationTest(scaleSchema);
const validateMeta = getSimpleValidationTest(hmsMetaSchema);

// JSON imports widen string literals, so state the shape the schema will check.
const data = fixture.data as unknown as HmsMeta;

Deno.test({
  name: "Module: HMS Meta",
  async fn(t) {
    await t.step("fixture scales match the schema", () => {
      validateMeta(data);
      for (const scale of Object.values(data.scales)) validateScale(scale);
      const heavy = data.scales["smoke-density"].levels
        .find((l) => l.key === "heavy");
      assertEquals(heavy?.opacity, 0.4);
    });

    await t.step("calls hms/meta and unwraps the scales", async () => {
      const stub = stubFetch(() => jsonResponse(fixture));
      try {
        const meta = await getHmsMeta();
        assertEquals(stub.calls[0].url.pathname, "/api/2.0/hms/meta/");
        assertEquals(Object.keys(meta.scales), ["smoke-density", "fire-frp"]);
      } finally {
        stub.restore();
      }
    });

    await t.step("GET  hms/meta/", async () => {
      try {
        const meta = await getHmsMeta();
        validateScale(meta.scales["smoke-density"]);
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("hms/meta/ unavailable; skipping.");
      }
    });
  },
});
