import { assert, assertEquals, assertRejects } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { scaleSchema } from "../meta/schemas/mod.ts";
import fixture from "./fixtures/calheatscore_meta.json" with { type: "json" };
import listFixture from "./fixtures/calheatscore_list.json" with {
  type: "json",
};
import placeFixture from "./fixtures/heat_for_place.json" with {
  type: "json",
};
import { getCalHeatScoreMeta } from "./get_calheatscore_meta.ts";
import { getCalHeatScores } from "./get_calheatscores.ts";
import { getHeatForPlace } from "./get_heat_for_place.ts";
import {
  calHeatScoreMetaSchema,
  calHeatScoreSchema,
  heatForPlaceSchema,
} from "./schemas/mod.ts";
import type { CalHeatScore, CalHeatScoreMeta, HeatForPlace } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateScale = getSimpleValidationTest(scaleSchema);
const validateMeta = getSimpleValidationTest(calHeatScoreMetaSchema);
const validateScore = getSimpleValidationTest(calHeatScoreSchema);
const validatePlace = getSimpleValidationTest(heatForPlaceSchema);

// JSON imports widen string literals, so state the shape the schema will check.
const data = fixture.data as unknown as CalHeatScoreMeta;
const listData = listFixture.data as unknown as Array<CalHeatScore>;
const placeData = placeFixture.data as unknown as HeatForPlace;

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

Deno.test({
  name: "Module: CalHeatScore data",
  async fn(t) {
    await t.step("fixtures match the schemas", () => {
      validateScore(listData);
      validatePlace(placeData);
    });

    await t.step(
      "getCalHeatScores sends filters and unwraps rows",
      async () => {
        const stub = stubFetch(() => jsonResponse(listFixture));
        try {
          const rows = await getCalHeatScores({
            date: "2026-11-03",
            zipcode: ["93701", "93210"],
          });
          const { pathname, searchParams } = stub.calls[0].url;
          assertEquals(pathname, "/api/2.0/calheatscore/");
          assertEquals(searchParams.get("date"), "2026-11-03");
          assertEquals(searchParams.get("zipcode__in"), "93701,93210");
          assertEquals(searchParams.has("zipcode"), false);
          assertEquals(rows.length, 2);
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("getCalHeatScores sends one zipcode as zipcode", async () => {
      const stub = stubFetch(() => jsonResponse(listFixture));
      try {
        await getCalHeatScores({ zipcode: "93701" });
        const { searchParams } = stub.calls[0].url;
        assertEquals(searchParams.get("zipcode"), "93701");
        assertEquals(searchParams.has("zipcode__in"), false);
      } finally {
        stub.restore();
      }
    });

    await t.step(
      "getCalHeatScores with no zipcodes sends nothing",
      async () => {
        const stub = stubFetch(() => jsonResponse(listFixture));
        try {
          const rows = await getCalHeatScores({ zipcode: [] });
          assertEquals(rows, []);
          assertEquals(stub.calls.length, 0);
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("getCalHeatScores follows pages", async () => {
      const stub = stubFetch((url) => {
        const page = url.searchParams.get("page") ?? "1";
        return jsonResponse({
          data: [listFixture.data[Number(page) - 1]],
          page: Number(page),
          count: 2,
          pages: 2,
          has_next_page: page === "1",
          has_previous_page: page === "2",
        });
      });
      try {
        const rows = await getCalHeatScores();
        assertEquals(rows.map((r) => r.zipcode), ["93210", "93701"]);
        assertEquals(stub.calls.length, 2);
      } finally {
        stub.restore();
      }
    });

    await t.step("getHeatForPlace sends a region and dates", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        const heat = await getHeatForPlace(
          { region: { type: "county", external_id: "06019" } },
          { gte: "2026-11-03", lte: "2026-11-05" },
        );
        const { pathname, searchParams } = stub.calls[0].url;
        assertEquals(pathname, "/api/2.0/calheatscore/place/");
        assertEquals(searchParams.get("region_type"), "county");
        assertEquals(searchParams.get("region"), "06019");
        assertEquals(searchParams.get("date__gte"), "2026-11-03");
        assertEquals(searchParams.get("date__lte"), "2026-11-05");
        assertEquals(heat.zip_count, 58);
      } finally {
        stub.restore();
      }
    });

    await t.step("a monitor place validates", () => {
      validatePlace({
        ...placeData,
        place: { monitor: "abc" },
      });
    });

    await t.step("getHeatForPlace sends a monitor and one date", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        await getHeatForPlace({ monitor: "abc" }, { date: "2026-11-03" });
        const { searchParams } = stub.calls[0].url;
        assertEquals(searchParams.get("monitor"), "abc");
        assertEquals(searchParams.get("date"), "2026-11-03");
        assertEquals(searchParams.has("region"), false);
      } finally {
        stub.restore();
      }
    });

    await t.step(
      "getHeatForPlace refuses land use before fetching",
      async () => {
        const stub = stubFetch(() => jsonResponse(placeFixture));
        try {
          await assertRejects(
            () =>
              getHeatForPlace({
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

    await t.step("GET  calheatscore/place/ for Fresno County", async () => {
      try {
        const heat = await getHeatForPlace({
          region: { type: "county", external_id: "06019" },
        });
        validatePlace(heat);
        assert(heat.zip_count > 0);
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("calheatscore/place/ unavailable; skipping.");
      }
    });
  },
});
