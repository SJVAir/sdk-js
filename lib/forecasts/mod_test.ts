import { assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { scaleSchema } from "../meta/schemas/mod.ts";
import fixture from "./fixtures/forecasts_meta.json" with { type: "json" };
import { getForecastsMeta } from "./get_forecasts_meta.ts";
import { forecastsMetaSchema } from "./schemas/mod.ts";
import type { ForecastsMeta } from "./types.ts";

// JSON imports widen string literals, so state the shape the schema will check.
const data = fixture.data as unknown as ForecastsMeta;

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateScale = getSimpleValidationTest(scaleSchema);
const validateMeta = getSimpleValidationTest(forecastsMetaSchema);

Deno.test({
  name: "Module: Forecasts Meta",
  async fn(t) {
    await t.step("fixture matches the schema", () => {
      validateMeta(data);
      assertEquals(data.zones.length, 9);
    });

    await t.step("a zone without a region parses", () => {
      const copy = structuredClone(data);
      copy.zones[0].region = null;
      validateMeta(copy);
    });

    await t.step(
      "calls forecasts/meta and unwraps scales and zones",
      async () => {
        const stub = stubFetch(() => jsonResponse(fixture));
        try {
          const meta = await getForecastsMeta();
          assertEquals(stub.calls[0].url.pathname, "/api/2.0/forecasts/meta/");
          assertEquals(meta.zones.length, 9);
          assertEquals(Object.keys(meta.scales), [
            "aqi-forecast",
            "burn-status",
          ]);
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("GET  forecasts/meta/", async () => {
      try {
        const meta = await getForecastsMeta();
        validateScale(meta.scales["aqi-forecast"]);
        assertEquals(meta.zones.length, 9);
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("forecasts/meta/ unavailable; skipping.");
      }
    });
  },
});
