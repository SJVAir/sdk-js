import { assert, assertEquals, assertRejects } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { scaleSchema } from "../meta/schemas/mod.ts";
import fixture from "./fixtures/forecasts_meta.json" with { type: "json" };
import listFixture from "./fixtures/forecasts_list.json" with { type: "json" };
import placeFixture from "./fixtures/forecast_for_place.json" with {
  type: "json",
};
import { getForecastForPlace } from "./get_forecast_for_place.ts";
import { getForecasts } from "./get_forecasts.ts";
import { getForecastsMeta } from "./get_forecasts_meta.ts";
import {
  forecastForPlaceSchema,
  forecastSchema,
  forecastsMetaSchema,
} from "./schemas/mod.ts";
import type { Forecast, ForecastForPlace, ForecastsMeta } from "./types.ts";

// JSON imports widen string literals, so state the shape the schema will check.
const data = fixture.data as unknown as ForecastsMeta;
const listData = listFixture.data as unknown as Array<Forecast>;
const placeData = placeFixture.data as unknown as ForecastForPlace;

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateScale = getSimpleValidationTest(scaleSchema);
const validateMeta = getSimpleValidationTest(forecastsMetaSchema);
const validateForecast = getSimpleValidationTest(forecastSchema);
const validatePlace = getSimpleValidationTest(forecastForPlaceSchema);

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

Deno.test({
  name: "Module: Forecasts data",
  async fn(t) {
    await t.step("fixtures match the schemas", () => {
      validateForecast(listData);
      validatePlace(placeData);
      assertEquals(placeData.rule, "county");
    });

    await t.step("getForecasts sends filters and unwraps rows", async () => {
      const stub = stubFetch(() => jsonResponse(listFixture));
      try {
        const rows = await getForecasts({
          region_id: "r6phe",
          gte: "2026-11-03",
          lte: "2026-11-05",
        });
        const { pathname, searchParams } = stub.calls[0].url;
        assertEquals(pathname, "/api/2.0/forecasts/");
        assertEquals(searchParams.get("region_id"), "r6phe");
        assertEquals(searchParams.get("forecast_date__gte"), "2026-11-03");
        assertEquals(searchParams.get("forecast_date__lte"), "2026-11-05");
        assertEquals(searchParams.has("forecast_date"), false);
        assertEquals(rows.length, 3);
      } finally {
        stub.restore();
      }
    });

    await t.step("getForecasts sends one date as forecast_date", async () => {
      const stub = stubFetch(() => jsonResponse(listFixture));
      try {
        await getForecasts({ forecast_date: "2026-11-04" });
        const { searchParams } = stub.calls[0].url;
        assertEquals(searchParams.get("forecast_date"), "2026-11-04");
      } finally {
        stub.restore();
      }
    });

    await t.step("a monitor place validates", () => {
      validatePlace({ ...placeData, place: { monitor: "abc" } });
    });

    await t.step("getForecastForPlace sends a region and dates", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        const result = await getForecastForPlace(
          { region: { type: "county", external_id: "06019" } },
          { date: "2026-11-03" },
        );
        const { pathname, searchParams } = stub.calls[0].url;
        assertEquals(pathname, "/api/2.0/forecasts/place/");
        assertEquals(searchParams.get("region_type"), "county");
        assertEquals(searchParams.get("region"), "06019");
        assertEquals(searchParams.get("forecast_date"), "2026-11-03");
        assertEquals(result.rule, "county");
        assertEquals(result.zone?.external_id, "06019");
      } finally {
        stub.restore();
      }
    });

    await t.step("getForecastForPlace sends a monitor", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        await getForecastForPlace({ monitor: "abc" }, { gte: "2026-11-03" });
        const { searchParams } = stub.calls[0].url;
        assertEquals(searchParams.get("monitor"), "abc");
        assertEquals(searchParams.get("forecast_date__gte"), "2026-11-03");
      } finally {
        stub.restore();
      }
    });

    await t.step("a place without a zone parses", () => {
      const copy = structuredClone(placeData);
      // deno-lint-ignore no-explicit-any
      const none = { ...copy, zone: null, rule: null, forecasts: [] } as any;
      validatePlace(none);
    });

    await t.step(
      "getForecastForPlace refuses land use before fetching",
      async () => {
        const stub = stubFetch(() => jsonResponse(placeFixture));
        try {
          await assertRejects(
            () =>
              getForecastForPlace({
                // deno-lint-ignore no-explicit-any
                region: { type: "land_use" as any, external_id: "1" },
              }),
            Error,
            "Land-use regions can't be looked up by code",
          );
          assertEquals(stub.calls.length, 0);
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("GET  forecasts/place/ for Fresno County", async () => {
      try {
        const result = await getForecastForPlace({
          region: { type: "county", external_id: "06019" },
        });
        validatePlace(result);
        assertEquals(result.rule, "county");
        assert(result.forecasts.length > 0);
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("forecasts/place/ unavailable; skipping.");
      }
    });
  },
});
