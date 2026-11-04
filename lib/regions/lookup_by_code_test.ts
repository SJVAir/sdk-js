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

Deno.test("getRegionsByCode throws before calling for land-use regions", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await assertRejects(
      // deno-lint-ignore no-explicit-any
      () => getRegionsByCode("land_use" as any, ["1"]),
      Error,
      "Land-use",
    );
    assertEquals(await getRegionsByCode("county", []), []);
    assertEquals(stub.calls.length, 0);
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

// Batching: the server resolves at most 100 codes per request.

const codes = (n: number) =>
  Array.from({ length: n }, (_, i) => String(i).padStart(5, "0"));

/** Answers each request with one region per requested code. */
function echoRegions(url: URL): Response {
  const requested = url.searchParams.get("external_id")!.split(",");
  return jsonResponse({
    data: requested.map((code) => ({ ...regions[0], external_id: code })),
  });
}

/** Answers each request with one location per requested code. */
function echoLocations(url: URL): Response {
  const requested = url.searchParams.get("external_id")!.split(",");
  return jsonResponse({
    data: requested.map((code) => ({
      ...schools[1],
      external_id: code,
      aliases: [],
    })),
  });
}

const requestedCodes = (stub: { calls: Array<{ url: URL }> }) =>
  stub.calls.map(({ url }) => url.searchParams.get("external_id")!.split(","));

Deno.test("getRegionsByCode splits 250 codes into 3 requests", async () => {
  const stub = stubFetch(echoRegions);
  try {
    const wanted = codes(250);
    const found = await getRegionsByCode("county", wanted);
    assertEquals(requestedCodes(stub), [
      wanted.slice(0, 100),
      wanted.slice(100, 200),
      wanted.slice(200),
    ]);
    assertEquals(found.map((region) => region.external_id), wanted);
    for (const { url } of stub.calls) {
      assertEquals(url.searchParams.get("type"), "county");
    }
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode sends 100 codes in one request and 101 in two", async () => {
  const stub = stubFetch(echoRegions);
  try {
    await getRegionsByCode("county", codes(100));
    assertEquals(stub.calls.length, 1);
    await getRegionsByCode("county", codes(101));
    assertEquals(stub.calls.length, 3);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode drops duplicate and blank codes", async () => {
  const stub = stubFetch(echoRegions);
  try {
    await getRegionsByCode("county", ["06019", " 06019 ", "", "06019"]);
    assertEquals(requestedCodes(stub), [["06019"]]);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode rejects with the signal's reason when aborted mid-batch", async () => {
  const controller = new AbortController();
  const stub = stubFetch((url, _init, call) => {
    if (call === 0) controller.abort("stop");
    return echoRegions(url);
  });
  try {
    const reason = await getRegionsByCode("county", codes(250), {
      signal: controller.signal,
    }).then(() => "resolved", (e) => e);
    assertEquals(reason, "stop");
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsByCode rejects when one chunk fails", async () => {
  const stub = stubFetch((url, _init, call) =>
    call === 1 ? new Response("boom", { status: 500 }) : echoRegions(url)
  );
  try {
    await assertRejects(() => getRegionsByCode("county", codes(250)));
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode splits 250 codes into 3 requests", async () => {
  const stub = stubFetch(echoLocations);
  try {
    const wanted = codes(250);
    const found = await getLocationsByCode("cde-public", wanted);
    assertEquals(requestedCodes(stub), [
      wanted.slice(0, 100),
      wanted.slice(100, 200),
      wanted.slice(200),
    ]);
    assertEquals(found.map((location) => location.external_id), wanted);
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode keeps alias matches across chunks", async () => {
  const wanted = codes(150);
  const stub = stubFetch((url) => {
    const requested = url.searchParams.get("external_id")!.split(",");
    // Answer the last code by alias only.
    return jsonResponse({
      data: requested.map((code) =>
        code === wanted[149]
          ? { ...schools[1], external_id: "renumbered", aliases: [code] }
          : { ...schools[1], external_id: code, aliases: [] }
      ),
    });
  });
  try {
    const found = await getLocationsByCode("cde-public", wanted);
    assertEquals(stub.calls.length, 2);
    assertEquals(found.length, 150);
    assertEquals(found.at(-1)?.external_id, "renumbered");
  } finally {
    stub.restore();
  }
});

Deno.test("getLocationsByCode drops duplicate codes and rejects when aborted mid-batch", async () => {
  const controller = new AbortController();
  const stub = stubFetch((url, _init, call) => {
    if (call === 1) controller.abort("stop");
    return echoLocations(url);
  });
  try {
    await getLocationsByCode("cde-public", ["1", " 1", "1"]);
    assertEquals(requestedCodes(stub), [["1"]]);
    const reason = await getLocationsByCode("cde-public", codes(250), {
      signal: controller.signal,
    }).then(() => "resolved", (e) => e);
    assertEquals(reason, "stop");
  } finally {
    stub.restore();
  }
});
