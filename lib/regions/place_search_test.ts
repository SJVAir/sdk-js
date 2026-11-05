import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getSimpleValidationTest } from "$testing";
import { assert, assertEquals } from "@std/assert";
import searchFixture from "./fixtures/regions_places_search.json" with {
  type: "json",
};
import { searchRegionPlaces } from "./get_region_places.ts";
import { boundaryListSchema, regionPlaceMatchSchema } from "./schemas/mod.ts";
import type { RegionPlaceMatch } from "./types.ts";

// Captured from regions/places/search/?q=fresno on a server running
// sjvair.com #308. JSON imports widen string literals, so state the shape the
// schema will check.
const rows = searchFixture.data as unknown as Array<RegionPlaceMatch>;

const validateMatch = getSimpleValidationTest(regionPlaceMatchSchema);

Deno.test("search rows match the place match schema", () => {
  validateMatch(rows);
  assertEquals(rows[0].county, null);
  assertEquals(rows[1].county?.external_id, "06019");
});

Deno.test("searchRegionPlaces calls regions/places/search and returns rows", async () => {
  const stub = stubFetch(() => jsonResponse(searchFixture));
  try {
    const matches = await searchRegionPlaces("fresno", "city");
    const { pathname, searchParams } = stub.calls[0].url;
    assertEquals(pathname, "/api/2.0/regions/places/search/");
    assertEquals(searchParams.get("q"), "fresno");
    assertEquals(searchParams.get("type"), "city");
    assertEquals(matches.length, 2);
    assertEquals(matches[1].county?.name, "Fresno County");
  } finally {
    stub.restore();
  }
});

Deno.test("a retired row without a county validates; a row without county fails", () => {
  const retired = {
    ...rows[1],
    county: null,
    retired: { since: "2024-01-01", replaced_by: null },
  };
  assertEquals(regionPlaceMatchSchema.safeParse(retired).success, true);
  const { county: _, ...withoutCounty } = rows[1];
  assertEquals(regionPlaceMatchSchema.safeParse(withoutCounty).success, false);
});

Deno.test("the place match schema has no also_in or geometry", () => {
  assertEquals("also_in" in regionPlaceMatchSchema.shape, false);
  assertEquals("geometry" in boundaryListSchema.shape, false);
  assert(regionPlaceMatchSchema.shape.boundary.unwrap() === boundaryListSchema);
});
