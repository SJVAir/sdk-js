import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import regionsMetaFixture from "./fixtures/regions_meta.json" with {
  type: "json",
};
import overlapsFixture from "./fixtures/regions_overlaps.json" with {
  type: "json",
};
import geojsonFixture from "./fixtures/regions_geojson.json" with {
  type: "json",
};
import { getRegionsGeoJSON } from "./get_regions_geojson.ts";
import { getRegionsList } from "./get_regions_list.ts";
import { getRegionsMeta } from "./get_regions_meta.ts";
import {
  regionFeatureCollectionSchema,
  regionGeometrySchema,
  regionListItemSchema,
  regionOverlapSchema,
  regionsMetaSchema,
  regionTypeMetaSchema,
} from "./schemas/mod.ts";
import type {
  RegionFeatureCollection,
  RegionListItem,
  RegionsMetaData,
} from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

// The fixtures were captured from the server that serves these endpoints.
// JSON imports widen string literals, so state the shape the schema checks.
const metaData = regionsMetaFixture.data as unknown as RegionsMetaData;
const overlaps = overlapsFixture.data as unknown as Array<RegionListItem>;
const collection = geojsonFixture as unknown as RegionFeatureCollection;

Deno.test("regions meta fixture carries the hierarchy fields", () => {
  getSimpleValidationTest(regionsMetaSchema)(metaData);
  assertEquals(metaData.types.zipcode.parents?.includes("county"), true);
  assertEquals(metaData.types.zipcode.referenceable, true);
  assertEquals(metaData.types.zipcode.browsable, true);
  assertEquals(metaData.types.mtrs.browsable, false);
  assertEquals(typeof metaData.types.county.count, "number");
});

Deno.test("overlap list fixture carries also_in", () => {
  getSimpleValidationTest(regionListItemSchema)(overlaps);
  const [first] = overlaps;
  assertEquals(first.also_in?.[0].type, "county");
  assertExists(first.also_in?.[0].external_id);
  assertExists(first.also_in?.[0].name);
});

Deno.test("getRegionsList sends within_mode", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await getRegionsList({
      type: "zipcode",
      within: "r6phe",
      within_mode: "overlaps",
    });
    assertEquals(stub.calls[0].url.searchParams.get("within_mode"), "overlaps");
    assertEquals(stub.calls[0].url.searchParams.get("within"), "r6phe");
  } finally {
    stub.restore();
  }
});

Deno.test("region geometry accepts polygons and rejects untyped coordinates", () => {
  const polygon = {
    type: "Polygon",
    coordinates: [[[-119, 36], [-119, 37], [-118, 37], [-119, 36]]],
  };
  assertEquals(regionGeometrySchema.safeParse(polygon).success, true);
  assertEquals(
    regionGeometrySchema.safeParse({ ...polygon, type: "MultiPolygon" })
      .success,
    false,
  );
  assertEquals(
    regionGeometrySchema.safeParse({ type: "Polygon", coordinates: ["x"] })
      .success,
    false,
  );
});

Deno.test("an overlap entry may have no external_id", () => {
  assertEquals(
    regionOverlapSchema.safeParse({
      type: "county",
      external_id: null,
      name: "X",
    }).success,
    true,
  );
});

Deno.test("region GeoJSON fixture matches the schema", () => {
  getSimpleValidationTest(regionFeatureCollectionSchema)(collection);
  assertEquals(collection.features.length, 2);
  const [fresno] = collection.features;
  assertEquals(fresno.id, fresno.properties.id);
  assertEquals(fresno.properties.type, "county");
  assertEquals(fresno.properties.retired, null);
});

Deno.test("getRegionsGeoJSON sends the query and returns the collection", async () => {
  const stub = stubFetch(() => jsonResponse(geojsonFixture));
  try {
    const result = await getRegionsGeoJSON({
      type: "county",
      external_id: ["06019", "06107"],
      within: ["a", "b"],
      within_mode: "overlaps",
      slug: "s",
      name: "n",
      simplify: true,
    });
    assertEquals(result.features.length, 2);
    const params = stub.calls[0].url.searchParams;
    assertEquals(
      stub.calls[0].url.pathname.endsWith("/regions/geojson/"),
      true,
    );
    assertEquals(params.get("type"), "county");
    assertEquals(params.get("external_id"), "06019,06107");
    assertEquals(params.getAll("within"), ["a", "b"]);
    assertEquals(params.get("within_mode"), "overlaps");
    assertEquals(params.get("simplify"), "1");
    assertEquals(params.get("slug"), "s");
    assertEquals(params.get("name"), "n");
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON omits simplify unless true", async () => {
  const stub = stubFetch(() => jsonResponse(geojsonFixture));
  try {
    await getRegionsGeoJSON({ type: "county", external_id: "06019" });
    await getRegionsGeoJSON({ type: "county", simplify: false });
    assertEquals(stub.calls[0].url.searchParams.get("external_id"), "06019");
    assertEquals(stub.calls[0].url.searchParams.has("simplify"), false);
    assertEquals(stub.calls[1].url.searchParams.has("simplify"), false);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON rejects land use by code before fetching", async () => {
  const stub = stubFetch();
  try {
    await assertRejects(
      () => getRegionsGeoJSON({ type: "land_use", external_id: "1" }),
      Error,
      "Land-use regions can't be looked up by code",
    );
    assertEquals(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

// Integration steps against the served API; skipped when it is unavailable.
Deno.test({
  name: "regions hierarchy (live server)",
  permissions: { net: true },
  async fn(t) {
    let meta;
    try {
      meta = await getRegionsMeta();
    } catch (error) {
      if (!isUnavailable(error)) throw error;
      console.warn(
        `Skipping the live region steps (${(error as Error).message}).`,
      );
      return;
    }
    if (meta.type("zipcode")?.parents === undefined) {
      console.warn(
        "Skipping the live region steps: server lacks the new fields.",
      );
      return;
    }

    await t.step("zipcode parents include county", () => {
      assertEquals(meta.type("zipcode")?.parents?.includes("county"), true);
    });

    await t.step("overlaps returns more ZIPs than contained", async () => {
      const [fresno] = await getRegionsList({
        type: "county",
        name: "Fresno County",
      });
      // The overlaps query can take several seconds on real data.
      const signal = AbortSignal.timeout(60_000);
      const contained = await getRegionsList(
        { type: "zipcode", within: fresno.id },
        { signal },
      );
      const overlapping = await getRegionsList(
        { type: "zipcode", within: fresno.id, within_mode: "overlaps" },
        { signal },
      );
      assertEquals(overlapping.length > contained.length, true);
    });

    await t.step("geojson by two county codes returns 2 features", async () => {
      const result = await getRegionsGeoJSON({
        type: "county",
        external_id: ["06019", "06107"],
        simplify: true,
      });
      assertEquals(result.features.length, 2);
    });
  },
});

Deno.test("regions meta types carry a plural label", () => {
  assertEquals(metaData.types.county.label_plural, "Counties");
  assertEquals(metaData.types.zipcode.label_plural, "ZIP Codes");
  assertEquals(metaData.types.ab617.label_plural, "AB 617 Communities");
  for (const meta of Object.values(metaData.types)) {
    assert(meta.label_plural, `${meta.type} has no label_plural`);
  }
  const { label_plural: _, ...withoutPlural } = metaData.types.county;
  assertEquals(regionTypeMetaSchema.safeParse(withoutPlural).success, false);
});
