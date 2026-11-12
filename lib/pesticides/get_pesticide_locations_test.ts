import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getSimpleValidationTest } from "$testing";
import { assertEquals } from "@std/assert";
import locationsFixture from "./fixtures/pesticide_locations.json" with {
  type: "json",
};
import { getPesticideLocations } from "./get_pesticide_locations.ts";
import { pesticideLocationFeatureSchema } from "./schemas/mod.ts";
import type { PesticideLocationFeature } from "./types.ts";

// Captured from the server's pesticides/locations/ (a bbox around Fresno).
const validateFeature = getSimpleValidationTest(pesticideLocationFeatureSchema);

async function paramsFor(
  params: Parameters<typeof getPesticideLocations>[0],
): Promise<URL> {
  const stub = stubFetch(() => jsonResponse(locationsFixture));
  try {
    await getPesticideLocations(params);
    assertEquals(stub.calls.length, 1);
    return stub.calls[0].url;
  } finally {
    stub.restore();
  }
}

Deno.test("locations fixture matches the schema", () => {
  validateFeature(
    locationsFixture.features as unknown as Array<PesticideLocationFeature>,
  );
  assertEquals(locationsFixture.type, "FeatureCollection");
});

Deno.test("locations carry their source and code", () => {
  const [childCare, publicSchool] = locationsFixture.features;
  assertEquals(childCare.properties.source, "cdss-ccl");
  assertEquals(childCare.properties.external_id, "103801760");
  assertEquals(publicSchool.properties.source, "cde-public");
  assertEquals(publicSchool.properties.external_id, "10621666006068");
});

Deno.test("a location without a source fails the schema", () => {
  const { source: _source, ...properties } =
    locationsFixture.features[0].properties;
  const feature = { ...locationsFixture.features[0], properties };
  assertEquals(
    pesticideLocationFeatureSchema.safeParse(feature).success,
    false,
  );
});

Deno.test("getPesticideLocations sends the bbox as w,s,e,n", async () => {
  const url = await paramsFor({ bbox: [-119.9, 36.7, -119.7, 36.85] });
  assertEquals(url.pathname.endsWith("/pesticides/locations/"), true);
  assertEquals(url.searchParams.get("bbox"), "-119.9,36.7,-119.7,36.85");
  assertEquals(url.searchParams.has("region"), false);
});

Deno.test("getPesticideLocations returns the bare collection", async () => {
  const stub = stubFetch(() => jsonResponse(locationsFixture));
  try {
    const result = await getPesticideLocations({ bbox: [0, 0, 1, 1] });
    assertEquals(result.type, "FeatureCollection");
    assertEquals(result.features.length, locationsFixture.features.length);
  } finally {
    stub.restore();
  }
});

Deno.test("getPesticideLocations sends region and buffer", async () => {
  const { searchParams } = await paramsFor({ region: "abc12", buffer: 3 });
  assertEquals(searchParams.get("region"), "abc12");
  assertEquals(searchParams.get("buffer"), "3");
  assertEquals(searchParams.has("bbox"), false);
});

Deno.test("getPesticideLocations omits buffer when unset", async () => {
  const { searchParams } = await paramsFor({ region: "abc12" });
  assertEquals(searchParams.has("buffer"), false);
});

Deno.test("getPesticideLocations sends lat, lng and radius", async () => {
  const { searchParams } = await paramsFor({
    lat: 36.74,
    lng: -119.79,
    radius: 2.5,
  });
  assertEquals(searchParams.get("lat"), "36.74");
  assertEquals(searchParams.get("lng"), "-119.79");
  assertEquals(searchParams.get("radius"), "2.5");
});

Deno.test("getPesticideLocations omits radius when unset", async () => {
  const { searchParams } = await paramsFor({ lat: 36.74, lng: -119.79 });
  assertEquals(searchParams.has("radius"), false);
});

Deno.test("getPesticideLocations comma-joins types and passes county", async () => {
  const { searchParams } = await paramsFor({
    bbox: [-119.9, 36.7, -119.7, 36.85],
    type: ["public_school", "child_care"],
    county: "fresno",
  });
  assertEquals(searchParams.get("type"), "public_school,child_care");
  assertEquals(searchParams.get("county"), "fresno");
});

Deno.test("getPesticideLocations sends a single type as is", async () => {
  const { searchParams } = await paramsFor({
    bbox: [0, 0, 1, 1],
    type: "private_school",
  });
  assertEquals(searchParams.get("type"), "private_school");
  assertEquals(searchParams.has("county"), false);
});
