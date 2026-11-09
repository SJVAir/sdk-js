import { setOrigin } from "$http";
import {
  EXISTING_MONITOR_ID,
  getSimpleValidationTest,
  isUnavailable,
} from "$testing";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { assertEquals, assertExists, assertRejects } from "@std/assert";
import {
  locationSchema,
  regionListItemSchema,
  regionPlaceMatchSchema,
  regionSchema,
  regionsMetaSchema,
  regionSummarySchema,
  regionWithSummariesSchema,
} from "./schemas/mod.ts";
import { getLocationsByCode } from "./get_locations_by_code.ts";
import { getRegionsByCode } from "./get_regions_by_code.ts";
import { getRegionsList } from "./get_regions_list.ts";
import { getRegionDetails } from "./get_region_details.ts";
import { lookupRegionPlace, searchRegionPlaces } from "./get_region_places.ts";
import {
  getRegionSummariesDaily,
  getRegionSummariesDailyOpen,
  getRegionSummariesHourly,
  getRegionSummariesMonthly,
  getRegionSummariesQuarterly,
  getRegionSummariesSeasonal,
  getRegionSummariesYearly,
} from "./get_region_summaries.ts";
import {
  getRegionSummariesBulkDaily,
  getRegionSummariesBulkDailyOpen,
} from "./get_region_summaries_bulk.ts";
import { getRegionsMeta } from "./get_regions_meta.ts";

// Read here: the test blocks below only allow network access.
// The open-day steps skip under TEST_REMOTE because production doesn't serve
// those endpoints yet. Once sjvair.com #320 and #321 reach production, drop
// their `ignore: isRemote` so they run against the live API too.
const isRemote = Deno.env.has("TEST_REMOTE");

if (!isRemote) {
  setOrigin("http://127.0.0.1:8000");
}

// A server older than the external_id/retired fields would fail the region
// schemas on those fields alone; the validators below pass through (and the
// lookup-by-code steps skip) with a note instead.
// TODO: remove once on develop
let hasCodes = true;
const skippable = <T>(validate: (data: T) => void) => (data: T) => {
  if (hasCodes) validate(data);
};

const validateRegion = skippable(getSimpleValidationTest(regionSchema));
const validateRegionListItem = skippable(
  getSimpleValidationTest(regionListItemSchema),
);
const validatePlaceMatch = skippable(
  getSimpleValidationTest(regionPlaceMatchSchema),
);
const validateRegionSummary = getSimpleValidationTest(regionSummarySchema);
const validateRegionsMeta = getSimpleValidationTest(regionsMetaSchema);
const validateRegionWithSummaries = skippable(
  getSimpleValidationTest(regionWithSummariesSchema),
);

Deno.test({
  name: "Module: Regions Endpoints",
  permissions: { net: true },
  async fn(t) {
    // Regions of type "land_use" alone number in the tens of thousands, so an
    // unfiltered regions/ call returns a multi-hundred-MB response. Always
    // scope test setup with a filter to keep the suite fast.
    const counties = await getRegionsList({ type: "county" });

    const county = counties[0];
    assertExists(county, "No county region found in regions/ response");

    hasCodes = "external_id" in county && "retired" in county;
    if (!hasCodes) {
      console.warn(
        "Skipping the region schema and lookup-by-code checks: the server's " +
          "regions have no external_id/retired fields.",
      );
    }
    validateRegionListItem(counties);

    const summaryYear = new Date().getFullYear();

    await t.step(
      "GET  regions/ (type filter)",
      () => {
        assertEquals(
          counties.every((region) => region.type === "county"),
          true,
        );
      },
    );

    await t.step(
      "GET  regions/ (no filters, rejected client-side)",
      async () => {
        await assertRejects(
          // deno-lint-ignore no-explicit-any
          () => getRegionsList({} as any),
          Error,
          "at least one",
        );
      },
    );

    await t.step(
      "GET  regions/ (slug filter)",
      async () => {
        const matches = await getRegionsList({
          slug: county.slug,
          type: "county",
        });
        validateRegionListItem(matches);
        assertEquals(matches.length, 1);
        assertEquals(matches[0].id, county.id);
      },
    );

    await t.step(
      "GET  regions/ (within filter)",
      async () => {
        const [unfiltered, withinCounty] = await Promise.all([
          getRegionsList({ type: "tract" }),
          getRegionsList({ type: "tract", within: county.id }),
        ]);
        validateRegionListItem(withinCounty);
        assertEquals(
          withinCounty.every((region) => region.type === "tract"),
          true,
        );
        assertEquals(withinCounty.length < unfiltered.length, true);
      },
    );

    await t.step(
      "GET  regions/ (within filter, array)",
      async () => {
        const matches = await getRegionsList({
          type: "tract",
          within: [county.id],
        });
        validateRegionListItem(matches);
        assertEquals(
          matches.every((region) => region.type === "tract"),
          true,
        );
      },
    );

    await t.step(
      "GET  regions/{REGION_ID}/",
      async () => validateRegion(await getRegionDetails(county.id)),
    );

    await t.step(
      "GET  regions/places/search/",
      async () => {
        const matches = await searchRegionPlaces(county.name, "county");
        validatePlaceMatch(matches);
        assertEquals(
          matches.some((region) => region.id === county.id),
          true,
        );
      },
    );

    await t.step(
      "GET  regions/places/lookup/",
      async () => {
        const match = await lookupRegionPlace(county.name, "county");
        assertExists(
          match,
          "No region found in regions/places/lookup/ response",
        );
        validateRegion(match);
        assertEquals(match.id, county.id);
      },
    );

    await t.step(
      "GET  regions/places/lookup/ (no match)",
      async () => {
        const match = await lookupRegionPlace(
          "this-place-does-not-exist-anywhere",
        );
        assertEquals(match, null);
      },
    );

    await t.step("POST regions/places/lookup/ (point)", async () => {
      const places = await lookupRegionPlace({
        lat: 36.7378,
        lon: -119.7871,
      });
      validateRegionListItem(places);
      const fresno = places.find((place) => place.type === "county");
      assertExists(fresno, "No county in the point lookup response");
      assertEquals(fresno.name, "Fresno County");
    });

    await t.step("POST regions/places/lookup/ (type array)", async () => {
      const places = await lookupRegionPlace({
        lat: 36.7378,
        lon: -119.7871,
        type: ["zipcode", "county"],
      });
      validateRegionListItem(places);
      assertEquals(places.length > 0, true);
      assertEquals(
        places.every((p) => p.type === "zipcode" || p.type === "county"),
        true,
      );
    });

    await t.step("GET  regions/places/lookup/ (monitor)", async () => {
      const places = await lookupRegionPlace({
        monitor: EXISTING_MONITOR_ID,
        type: ["county"],
      });
      validateRegionListItem(places);
      assertEquals(places.every((p) => p.type === "county"), true);
    });

    await t.step(
      "GET  regions/{REGION_ID}/summaries/pm25/hourly/{YEAR}/",
      async () =>
        validateRegionSummary(
          await getRegionSummariesHourly({
            regionId: county.id,
            entryType: "pm25",
            year: summaryYear,
          }),
        ),
    );

    await t.step(
      "GET  regions/{REGION_ID}/summaries/pm25/daily/{YEAR}/",
      async () =>
        validateRegionSummary(
          await getRegionSummariesDaily({
            regionId: county.id,
            entryType: "pm25",
            year: summaryYear,
          }),
        ),
    );

    await t.step({
      name: "GET  regions/{REGION_ID}/summaries/pm25/daily/open/",
      ignore: isRemote,
      fn: async () => {
        const rows = await getRegionSummariesDailyOpen({
          regionId: county.id,
          entryType: "pm25",
        });
        if (!rows.length) {
          console.warn("No open-day rows for the county (local data gap)");
        }
        validateRegionSummary(rows);
        for (const row of rows) assertEquals(row.is_final, false);
      },
    });

    await t.step({
      name: "GET  regions/{entry_type}/summaries/daily/open/",
      ignore: isRemote,
      fn: async () => {
        const regions = await getRegionSummariesBulkDailyOpen({
          entryType: "pm25",
          region: county.id,
        });
        if (!regions.length) {
          console.warn("No open-day rows for the county (local data gap)");
        }
        validateRegionWithSummaries(regions);
        assertEquals(regions.every((r) => r.id === county.id), true);
        for (const region of regions) {
          const days = region.summaries.map((row) => row.timestamp);
          assertEquals(new Set(days).size, days.length);
        }
      },
    });

    await t.step(
      "GET  regions/{REGION_ID}/summaries/pm25/monthly/{YEAR}/",
      async () =>
        validateRegionSummary(
          await getRegionSummariesMonthly({
            regionId: county.id,
            entryType: "pm25",
            year: summaryYear,
          }),
        ),
    );

    await t.step(
      "GET  regions/{REGION_ID}/summaries/pm25/quarterly/{YEAR}/",
      async () =>
        validateRegionSummary(
          await getRegionSummariesQuarterly({
            regionId: county.id,
            entryType: "pm25",
            year: summaryYear,
          }),
        ),
    );

    await t.step(
      "GET  regions/{REGION_ID}/summaries/pm25/seasonal/{YEAR}/",
      async () =>
        validateRegionSummary(
          await getRegionSummariesSeasonal({
            regionId: county.id,
            entryType: "pm25",
            year: summaryYear,
          }),
        ),
    );

    await t.step(
      "GET  regions/{REGION_ID}/summaries/pm25/yearly/",
      async () =>
        validateRegionSummary(
          await getRegionSummariesYearly({
            regionId: county.id,
            entryType: "pm25",
          }),
        ),
    );

    // Bulk summaries are paginated by row, not by region - a wide-open
    // date range scoped to a single region is enough to exercise the
    // endpoint's shape; the split/merge behavior itself is covered
    // separately with fixture data in get_region_summaries_bulk_test.ts.
    await t.step(
      "GET  regions/{entry_type}/summaries/daily (bulk)",
      async () => {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 7);

        validateRegionWithSummaries(
          await getRegionSummariesBulkDaily({
            entryType: "pm25",
            start,
            end: today,
            region: county.id,
          }),
        );
      },
    );

    await t.step({
      name: "GET  regions/ (type + external_id lookup)",
      ignore: !hasCodes,
      fn: async () => {
        const code = county.external_id;
        assertExists(code, "The first county has no external_id");

        const found = await getRegionsByCode("county", [code]);
        validateRegionListItem(found);
        assertEquals(found.map((region) => region.id), [county.id]);

        assertEquals(await getRegionsByCode("county", ["no-such-code"]), []);
        await assertRejects(
          // deno-lint-ignore no-explicit-any
          () => getRegionsByCode("land_use" as any, ["1"]),
          Error,
          "Land-use",
        );
      },
    });

    await t.step(
      "GET  regions/meta",
      async () => validateRegionsMeta(await getRegionsMeta()),
    );

    await t.step(
      "GET  regions/meta (county type lookup)",
      async () => {
        const meta = await getRegionsMeta();
        const countyMeta = meta.type("county");

        assertExists(
          countyMeta,
          "No county entry found in regions/meta response",
        );
        assertEquals(countyMeta.category, "administrative");
      },
    );
  },
});

// The local dev server may run a branch without regions/locations/. On a 404
// or any network error, skip the location lookup with a note; the fixture
// tests in lookup_by_code_test.ts always run.
let locationsAvailable = true;
try {
  await getLocationsByCode("cdss-ccl", ["0"]);
} catch (error) {
  if (!isUnavailable(error)) throw error;
  locationsAvailable = false;
  console.warn(
    "Skipping the regions/locations/ integration steps: the endpoint is " +
      `unavailable (${(error as Error).message}).`,
  );
}

Deno.test({
  name: "Module: Regions Endpoints (locations by code)",
  permissions: { net: true, env: ["TEST_LOCATION_CCL_ID"] },
  ignore: !locationsAvailable,
  async fn(t) {
    await t.step("GET  regions/locations/ (unknown code)", async () => {
      assertEquals(await getLocationsByCode("cdss-ccl", ["no-such-code"]), []);
    });

    // Needs a cdss-ccl row in the local database; there is no list endpoint
    // to find one, so TEST_LOCATION_CCL_ID can name a known code.
    const knownCode = Deno.env.get("TEST_LOCATION_CCL_ID");
    await t.step({
      name: "GET  regions/locations/ (cdss-ccl round trip)",
      ignore: !knownCode,
      fn: async () => {
        const found = await getLocationsByCode("cdss-ccl", [knownCode!]);
        getSimpleValidationTest(locationSchema)(found);
        assertEquals(found.length, 1);
        assertEquals(
          found[0].external_id === knownCode ||
            found[0].aliases.includes(knownCode!),
          true,
        );
      },
    });
  },
});

Deno.test("lookupRegionPlace (point) rounds coordinates and POSTs a JSON body", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    const result = await lookupRegionPlace({
      lat: 36.73749,
      lon: -119.78712,
      type: ["zipcode", "county"],
    });
    assertEquals(result, []);
  } finally {
    stub.restore();
  }

  const { url, init } = stub.calls[0];
  assertEquals(init.method, "POST");
  assertEquals(url.search, "");
  assertEquals(url.pathname.endsWith("regions/places/lookup/"), true);
  assertEquals(JSON.parse(init.body as string), {
    lat: 36.737,
    lon: -119.787,
    type: "zipcode,county",
  });
});

Deno.test("lookupRegionPlace (point) omits type when not given", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await lookupRegionPlace({ lat: 36.5, lon: -119.5 });
  } finally {
    stub.restore();
  }
  assertEquals(JSON.parse(stub.calls[0].init.body as string), {
    lat: 36.5,
    lon: -119.5,
  });
});

Deno.test("lookupRegionPlace (monitor) GETs with searchParams", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await lookupRegionPlace({ monitor: "abc", type: ["zipcode", "county"] });
  } finally {
    stub.restore();
  }
  const { url, init } = stub.calls[0];
  assertEquals(init.method ?? "GET", "GET");
  assertEquals(url.searchParams.get("monitor"), "abc");
  assertEquals(url.searchParams.get("type"), "zipcode,county");
  assertEquals(url.searchParams.has("lat"), false);
});

Deno.test("lookupRegionPlace omits an empty type array", async () => {
  const stub = stubFetch(() => jsonResponse({ data: [] }));
  try {
    await lookupRegionPlace({ monitor: "abc", type: [] });
    await lookupRegionPlace({ lat: 36.5, lon: -119.5, type: [] });
  } finally {
    stub.restore();
  }
  assertEquals(stub.calls[0].url.searchParams.has("type"), false);
  assertEquals(
    "type" in JSON.parse(stub.calls[1].init.body as string),
    false,
  );
});
