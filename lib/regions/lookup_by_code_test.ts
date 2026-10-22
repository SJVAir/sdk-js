import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { getSimpleValidationTest } from "$testing";
import { assertEquals, assertRejects } from "@std/assert";
import regionDetailFixture from "./fixtures/region_detail.json" with {
  type: "json",
};
import regionsByCodeFixture from "./fixtures/regions_by_code.json" with {
  type: "json",
};
import cdePublicFixture from "./fixtures/locations_cde_public.json" with {
  type: "json",
};
import cdssCclFixture from "./fixtures/locations_cdss_ccl.json" with {
  type: "json",
};
import { getLocationsByCode } from "./get_locations_by_code.ts";
import { getRegionsByCode } from "./get_regions_by_code.ts";
import {
  locationSchema,
  regionListItemSchema,
  regionSchema,
} from "./schemas/mod.ts";
import type { Location, RegionData, RegionListItem } from "./types.ts";

// The fixtures were captured from the server code that serves these
// endpoints, using regions.yaml and created locations (including retired ones
// that name a replacement). JSON imports widen string literals, so state the
// shape the schema will check.
const regions = regionsByCodeFixture.data as unknown as Array<RegionListItem>;
const schools = cdePublicFixture.data as unknown as Array<Location>;
const childCare = cdssCclFixture.data as unknown as Array<Location>;

const validateRegionListItem = getSimpleValidationTest(regionListItemSchema);
const validateRegion = getSimpleValidationTest(regionSchema);
const validateLocation = getSimpleValidationTest(locationSchema);

Deno.test("region fixtures match the schemas", () => {
  validateRegionListItem(regions);
  validateRegion(regionDetailFixture.data as unknown as RegionData);

  const [current, retired] = regions;
  assertEquals(current.retired, null);
  assertEquals(retired.retired?.replaced_by, {
    type: "county",
    external_id: current.external_id,
  });
});

Deno.test("location fixtures match the schemas", () => {
  validateLocation(schools);
  validateLocation(childCare);

  const [retired, current] = schools;
  assertEquals(retired.retired?.replaced_by, {
    source: "cde-public",
    external_id: current.external_id,
  });
  assertEquals(current.regions.county?.type, "county");
  assertEquals(current.regions.city, null);
  assertEquals(childCare[0].aliases, ["153400002"]);
});

Deno.test("getRegionsByCode sends the type and comma-joined codes", async () => {
  const stub = stubFetch(() => jsonResponse(regionsByCodeFixture));
  try {
    const found = await getRegionsByCode("county", ["06019", "06029"]);
    assertEquals(found.length, 2);
    assertEquals(stub.calls.length, 1);
    const { url } = stub.calls[0];
    assertEquals(url.pathname.endsWith("/regions/"), true);
    assertEquals(url.searchParams.get("type"), "county");
    assertEquals(url.searchParams.get("external_id"), "06019,06029");
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode returns [] for an empty result", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    assertEquals(await getRegionsByCode("county", ["99999"]), []);
    assertEquals(stub.calls.length, 1);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode throws before calling when it can't be served", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => getRegionsByCode("land_use" as any, ["1"]),
      Error,
      "Land-use",
    );
    const tooMany = Array.from({ length: 101 }, (_, i) => String(i));
    await assertRejects(
      () => getRegionsByCode("county", tooMany),
      Error,
      "at most 100",
    );
    assertEquals(stub.calls.length, 0);

    // Exactly 100 is allowed, and no codes means no request.
    const hundred = tooMany.slice(0, 100);
    await getRegionsByCode("county", hundred);
    assertEquals(stub.calls.length, 1);
    assertEquals(await getRegionsByCode("county", []), []);
    assertEquals(stub.calls.length, 1);
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode sends the source and comma-joined codes", async () => {
  const stub = stubFetch(() => jsonResponse(cdssCclFixture));
  try {
    const found = await getLocationsByCode("cdss-ccl", ["153400002", "x"]);
    assertEquals(found.length, 1);
    const { url } = stub.calls[0];
    assertEquals(url.pathname.endsWith("/regions/locations/"), true);
    assertEquals(url.searchParams.get("source"), "cdss-ccl");
    assertEquals(url.searchParams.get("external_id"), "153400002,x");
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode returns [] for an empty result", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    assertEquals(await getLocationsByCode("cde-public", ["000"]), []);
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode throws before calling past 100 codes", async () => {
  const stub = stubFetch();
  try {
    const tooMany = Array.from({ length: 101 }, (_, i) => String(i));
    await assertRejects(
      () => getLocationsByCode("cde-public", tooMany),
      Error,
      "at most 100",
    );
    assertEquals(await getLocationsByCode("cde-public", []), []);
    assertEquals(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode drops rows the server returned unfiltered", async () => {
  const stub = stubFetch(() =>
    jsonResponse({
      data: [
        { ...regions[0], external_id: "06019" },
        { ...regions[1], external_id: "06029" },
        { ...regions[1], external_id: null },
      ],
    })
  );
  try {
    const found = await getRegionsByCode("county", [" 06019 "]);
    assertEquals(found.map((region) => region.external_id), ["06019"]);
    assertEquals(await getRegionsByCode("county", ["99999"]), []);
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode drops rows the server returned unfiltered", async () => {
  const stub = stubFetch(() => jsonResponse(cdssCclFixture));
  try {
    const [site] = childCare;
    assertEquals(site.aliases.length > 0, true);
    // Matches by alias, and an unrelated code matches nothing.
    assertEquals(
      (await getLocationsByCode("cdss-ccl", [site.aliases[0]])).length,
      1,
    );
    assertEquals(await getLocationsByCode("cdss-ccl", ["unrelated"]), []);
  } finally {
    stub.restore();
  }
});
