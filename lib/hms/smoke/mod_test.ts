import { assert, assertEquals } from "@std/assert";
import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { jsonResponse, stubFetch } from "../../http/fetch_stub_test_utils.ts";
import fixture from "../fixtures/smoke_for_place.json" with { type: "json" };
import { getHMSSmokeById } from "./get_smoke_by_id.ts";
import { getHMSSmoke } from "./get_smoke.ts";
import { getSmokeForPlace } from "./get_smoke_for_place.ts";
import { hmsSmokeSchema, smokeForPlaceSchema } from "./schema.ts";
import type { SmokeForPlace } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateHMSSmokeData = getSimpleValidationTest(hmsSmokeSchema);

Deno.test({
  name: "Module: Fetch HMS Smoke",
  permissions: { net: true },
  async fn(t) {
    await t.step("GET  hms/smoke/", async (t2) => {
      const smoke = await getHMSSmoke();
      assertEquals(Array.isArray(smoke), true);
      validateHMSSmokeData(smoke);

      if (smoke.length === 0) {
        console.warn(
          "No HMS smoke events found. Skipping GET hms-smoke/{id} test.",
        );
        return;
      }
      const smokeEventTarget = smoke[0];

      await t2.step(`GET hms/smoke/${smokeEventTarget.id}`, async () => {
        const smokeEvent = await getHMSSmokeById(smokeEventTarget.id);

        validateHMSSmokeData(smokeEvent);
      });
    });
  },
});

const validateSmokeForPlace = getSimpleValidationTest(smokeForPlaceSchema);

// JSON imports widen string literals, so state the shape the schema will check.
const placeData = fixture.data as unknown as SmokeForPlace;

Deno.test({
  name: "Module: Fetch HMS Smoke for a place",
  permissions: { net: true },
  async fn(t) {
    await t.step("smoke-for-place fixture matches the schema", () => {
      validateSmokeForPlace(placeData);
    });

    await t.step("getSmokeForPlace sends the place and range", async () => {
      const stub = stubFetch(() => jsonResponse(fixture));
      try {
        const smoke = await getSmokeForPlace(
          { region: { type: "county", external_id: "06019" } },
          { gte: "2026-10-01", lte: "2026-10-31" },
        );
        const { pathname, searchParams } = stub.calls[0].url;
        assertEquals(pathname, "/api/2.0/hms/smoke/place/");
        assertEquals(searchParams.get("region_type"), "county");
        assertEquals(searchParams.get("region"), "06019");
        assertEquals(searchParams.get("date__gte"), "2026-10-01");
        assertEquals(searchParams.get("date__lte"), "2026-10-31");
        assertEquals(smoke.days.length, 4);
      } finally {
        stub.restore();
      }
    });

    await t.step(
      "getSmokeForPlace sends no dates when none given",
      async () => {
        const stub = stubFetch(() => jsonResponse(fixture));
        try {
          await getSmokeForPlace({ monitor: "abc" });
          const { searchParams } = stub.calls[0].url;
          assertEquals(searchParams.get("monitor"), "abc");
          assertEquals(searchParams.has("date__gte"), false);
          assertEquals(searchParams.has("date__lte"), false);
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("live: getSmokeForPlace for Fresno County", async () => {
      try {
        const smoke = await getSmokeForPlace({
          region: { type: "county", external_id: "06019" },
        });
        validateSmokeForPlace(smoke);
        assert(smoke.days.length === 30);
      } catch (error) {
        // develop routes smoke/place/ to hms/smoke/<id>/, which answers 500 on
        // a malformed id; skip on any non-200 until sjvair.com #312 merges.
        const cause = (error as {
          cause?: { status?: number; result?: { status?: number } };
        })?.cause;
        const status = cause?.status ?? cause?.result?.status;
        if (!isUnavailable(error) && status === undefined) throw error;
        console.warn(
          `server without hms/smoke/place/ (sjvair.com #312); got ${
            status ?? "no response"
          }. Skipping.`,
        );
      }
    });
  },
});
