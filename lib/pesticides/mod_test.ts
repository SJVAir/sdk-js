import { apiCall, setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { assertEquals, assertExists } from "@std/assert";
import {
  chemicalDetailSchema,
  chemicalSchema,
  commodityDetailSchema,
  commoditySchema,
  pesticideNoticeSchema,
  pesticideSummaryResponseSchema,
  pesticideUseSchema,
  productDetailSchema,
  productSchema,
} from "./schemas/mod.ts";
import { getCommoditiesList } from "./get_commodities_list.ts";
import { getCommodityDetails } from "./get_commodity_details.ts";
import { getChemicalsList } from "./get_chemicals_list.ts";
import { getChemicalDetails } from "./get_chemical_details.ts";
import { getProductsList } from "./get_products_list.ts";
import { getProductDetails } from "./get_product_details.ts";
import { getPesticideUseList } from "./get_pesticide_use_list.ts";
import { getPesticideUseDetails } from "./get_pesticide_use_details.ts";
import { getPesticideNoticeList } from "./get_pesticide_notice_list.ts";
import { getPesticideNoticeDetails } from "./get_pesticide_notice_details.ts";
import { getRegionPesticideSummary } from "./get_region_pesticide_summary.ts";
import { getRegionPesticideNotices } from "./get_region_pesticide_notices.ts";
import { getRegionPesticideUse } from "./get_region_pesticide_use.ts";
import type { PesticideUseData } from "./types.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateChemical = getSimpleValidationTest(chemicalSchema);
const validateChemicalDetail = getSimpleValidationTest(chemicalDetailSchema);
const validateCommodity = getSimpleValidationTest(commoditySchema);
const validateCommodityDetail = getSimpleValidationTest(commodityDetailSchema);
const validateProduct = getSimpleValidationTest(productSchema);
const validateProductDetail = getSimpleValidationTest(productDetailSchema);
const validatePesticideUse = getSimpleValidationTest(pesticideUseSchema);
const validatePesticideNotice = getSimpleValidationTest(pesticideNoticeSchema);
const validatePesticideSummaryResponse = getSimpleValidationTest(
  pesticideSummaryResponseSchema,
);

Deno.test({
  name: "Module: Pesticides Endpoints",
  permissions: { net: true },
  async fn(t) {
    // Pesticide use records number in the hundreds of thousands per year, so
    // an unfiltered pesticides/use/ call would page through the entire
    // dataset. Fetch a single page directly to find a county/chemical/
    // commodity/product combination that actually has data locally, then
    // scope every other request to that combination to keep the suite fast.
    const page = await apiCall<{ data: Array<PesticideUseData> }>({
      url: "pesticides/use",
      searchParams: { year: "2022" },
    });
    const sampleUse = page.data.find((use) =>
      use.chemical && use.commodity && use.product
    );
    assertExists(
      sampleUse,
      "No pesticide use record with a chemical, commodity, and product found for year 2022",
    );

    const county = sampleUse.county;
    const chemical = sampleUse.chemical!;
    const commodity = sampleUse.commodity!;
    const product = sampleUse.product!;

    await t.step(
      "GET  pesticides/commodities/ (site_code filter)",
      async () => {
        const commodities = await getCommoditiesList({
          site_code: commodity.site_code,
        });
        validateCommodity(commodities);
        assertEquals(commodities.length, 1);
        assertEquals(commodities[0].id, commodity.id);
      },
    );

    await t.step(
      "GET  pesticides/commodities/{COMMODITY_ID}/",
      async () =>
        validateCommodityDetail(await getCommodityDetails(commodity.id)),
    );

    await t.step(
      "GET  pesticides/chemicals/ (chem_code filter)",
      async () => {
        const chemicals = await getChemicalsList({
          chem_code: chemical.chem_code,
        });
        validateChemical(chemicals);
        assertEquals(chemicals.length, 1);
        assertEquals(chemicals[0].id, chemical.id);
      },
    );

    await t.step(
      "GET  pesticides/chemicals/{CHEMICAL_ID}/",
      async () => validateChemicalDetail(await getChemicalDetails(chemical.id)),
    );

    await t.step(
      "GET  pesticides/products/ (name filter)",
      async () => {
        const products = await getProductsList({ name: product.name });
        validateProduct(products);
        assertEquals(
          products.some((p) => p.id === product.id),
          true,
        );
      },
    );

    await t.step(
      "GET  pesticides/products/{PRODUCT_ID}/",
      async () => validateProductDetail(await getProductDetails(product.id)),
    );

    await t.step(
      "GET  pesticides/use/ (year, county, chemical, commodity filters)",
      async () => {
        const uses = await getPesticideUseList({
          year: 2022,
          county: county.slug,
          chemical: chemical.chem_code,
          commodity: commodity.site_code,
        });
        validatePesticideUse(uses);
        assertEquals(uses.length > 0, true);
        assertEquals(uses.every((use) => use.county.id === county.id), true);
      },
    );

    await t.step(
      "GET  pesticides/use/{USE_ID}/",
      async () =>
        validatePesticideUse(await getPesticideUseDetails(sampleUse.id)),
    );

    await t.step(
      "GET  pesticides/region/{REGION_ID}/summary/ (year, chemical, commodity filters)",
      async () => {
        const summary = await getRegionPesticideSummary(county.id, {
          year: 2022,
          chemical: chemical.chem_code,
          commodity: commodity.site_code,
        });
        validatePesticideSummaryResponse(summary);
        assertEquals(summary.region.id, county.id);
        assertEquals(summary.data.length > 0, true);
      },
    );

    await t.step(
      "GET  pesticides/region/{REGION_ID}/use/ (year, chemical, commodity filters)",
      async () => {
        const uses = await getRegionPesticideUse(county.id, {
          year: 2022,
          chemical: chemical.chem_code,
          commodity: commodity.site_code,
        });
        validatePesticideUse(uses);
        assertEquals(uses.length > 0, true);
        assertEquals(uses.every((use) => use.county.id === county.id), true);
      },
    );

    await t.step(
      "GET  pesticides/notice/ (county filter)",
      async (t2) => {
        const notices = await getPesticideNoticeList({ county: county.slug });
        assertEquals(Array.isArray(notices), true);
        validatePesticideNotice(notices);

        if (notices.length === 0) {
          console.warn(
            "No pesticide notices found locally. Skipping GET pesticides/notice/{NOTICE_ID}/ test.",
          );
          return;
        }

        await t2.step(
          "GET  pesticides/notice/{NOTICE_ID}/",
          async () =>
            validatePesticideNotice(
              await getPesticideNoticeDetails(notices[0].id),
            ),
        );
      },
    );

    await t.step(
      "GET  pesticides/region/{REGION_ID}/notice/",
      async () => {
        const notices = await getRegionPesticideNotices(county.id);
        assertEquals(Array.isArray(notices), true);
        validatePesticideNotice(notices);
      },
    );
  },
});
