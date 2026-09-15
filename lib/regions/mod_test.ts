import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { assertEquals, assertExists } from "@std/assert";
import { regionSchema, regionSummarySchema } from "./schemas/mod.ts";
import { getRegionsList } from "./get_regions_list.ts";
import { getRegionDetails } from "./get_region_details.ts";
import { lookupRegionPlace, searchRegionPlaces } from "./get_region_places.ts";
import {
  getRegionSummariesDaily,
  getRegionSummariesHourly,
  getRegionSummariesMonthly,
  getRegionSummariesQuarterly,
  getRegionSummariesSeasonal,
  getRegionSummariesYearly,
} from "./get_region_summaries.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateRegion = getSimpleValidationTest(regionSchema);
const validateRegionSummary = getSimpleValidationTest(regionSummarySchema);

Deno.test({
  name: "Module: Regions Endpoints",
  permissions: { net: true },
  async fn(t) {
    // Regions of type "land_use" alone number in the tens of thousands, so an
    // unfiltered regions/ call returns a multi-hundred-MB response. Always
    // scope test setup with a filter to keep the suite fast.
    const counties = await getRegionsList({ type: "county" });
    validateRegion(counties);

    const county = counties[0];
    assertExists(county, "No county region found in regions/ response");

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
      "GET  regions/ (slug filter)",
      async () => {
        const matches = await getRegionsList({
          slug: county.slug,
          type: "county",
        });
        validateRegion(matches);
        assertEquals(matches.length, 1);
        assertEquals(matches[0].id, county.id);
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
        validateRegion(matches);
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
  },
});
