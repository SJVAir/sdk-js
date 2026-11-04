import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getSimpleValidationTest } from "$testing";
import { assertEquals, assertRejects } from "@std/assert";
import searchFixture from "./fixtures/locations_search.json" with {
  type: "json",
};
import regionsMetaFixture from "./fixtures/regions_meta.json" with {
  type: "json",
};
import { searchLocations } from "./search_locations.ts";
import { locationSchema, regionsMetaSchema } from "./schemas/mod.ts";
import type { Location, RegionsMetaData } from "./types.ts";

// Captured from the server's locations/search/ (q=lincoln). JSON imports widen
// string literals, so state the shape the schema will check.
const rows = searchFixture.data as unknown as Array<Location>;

const validateLocation = getSimpleValidationTest(locationSchema);
const validateMeta = getSimpleValidationTest(regionsMetaSchema);

Deno.test("search fixture matches the schema", () => {
  validateLocation(rows);
  assertEquals(typeof rows[0].regions.county?.name, "string");
  assertEquals(searchFixture.more, true);
});

Deno.test("searchLocations sends q, type and region", async () => {
  const stub = stubFetch(() => jsonResponse(searchFixture));
  try {
    await searchLocations({
      q: "lincoln visalia",
      type: ["public_school", "child_care"],
      region: { type: "county", external_id: "06107" },
    });
    assertEquals(stub.calls.length, 1);
    const { url } = stub.calls[0];
    assertEquals(url.pathname.endsWith("/regions/locations/search/"), true);
    assertEquals(url.searchParams.get("q"), "lincoln visalia");
    assertEquals(url.searchParams.get("type"), "public_school,child_care");
    assertEquals(url.searchParams.get("region_type"), "county");
    assertEquals(url.searchParams.get("region"), "06107");
  } finally {
    stub.restore();
  }
});

Deno.test("searchLocations sends a single type and omits unused params", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [], more: false }));
  try {
    await searchLocations({ q: "  oak ", type: "child_care" });
    const { searchParams } = stub.calls[0].url;
    assertEquals(searchParams.get("q"), "oak");
    assertEquals(searchParams.get("type"), "child_care");
    assertEquals(searchParams.has("region_type"), false);
    assertEquals(searchParams.has("region"), false);
  } finally {
    stub.restore();
  }
});

Deno.test("searchLocations returns results and more", async () => {
  const stub = stubFetch(() => jsonResponse(searchFixture));
  try {
    const found = await searchLocations({ q: "lincoln" });
    assertEquals(found, { results: rows, more: true });
  } finally {
    stub.restore();
  }
});

Deno.test("searchLocations skips the request under 2 characters", async () => {
  const stub = stubFetch(() => {
    throw new Error("should not be called");
  });
  try {
    assertEquals(await searchLocations({ q: " l " }), {
      results: [],
      more: false,
    });
    assertEquals(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

Deno.test("searchLocations passes the abort signal", async () => {
  const stub = stubFetch(() => jsonResponse(searchFixture));
  try {
    const controller = new AbortController();
    controller.abort();
    await assertRejects(() =>
      searchLocations({ q: "lincoln", signal: controller.signal })
    );
  } finally {
    stub.restore();
  }
});

Deno.test("regions meta lists location types", () => {
  validateMeta(regionsMetaFixture.data as unknown as RegionsMetaData);
  const types = regionsMetaFixture.data.location_types;
  assertEquals(types.child_care.source, "cdss-ccl");
  assertEquals(types.public_school.label, "Public school");
});

Deno.test("searchLocations region type only accepts filterable types", () => {
  const unused = (_: Parameters<typeof searchLocations>[0]) => {};
  unused({
    q: "lincoln",
    region: { type: "school_district", external_id: "1" },
  });
  // @ts-expect-error land_use regions can't filter a location search
  unused({ q: "lincoln", region: { type: "land_use", external_id: "1" } });
});
