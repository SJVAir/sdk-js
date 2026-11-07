import { apiCall, setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { assert, assertEquals, assertExists } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import placeFixture from "./fixtures/pesticides_for_place.json" with {
  type: "json",
};
import {
  getPesticidesForPlace,
  pesticidePlaceFilterErrors,
} from "./get_pesticides_for_place.ts";
import {
  chemicalDetailSchema,
  chemicalSchema,
  commodityDetailSchema,
  commoditySchema,
  pesticideNoticeSchema,
  pesticidesForPlaceSchema,
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
import type { PesticidesForPlace, PesticideUseData } from "./types.ts";

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

Deno.test({
  name: "Module: pesticides for a place",
  fn: async (t) => {
    const validatePlace = getSimpleValidationTest(pesticidesForPlaceSchema);
    const placeData = placeFixture.data as unknown as PesticidesForPlace;
    const county = {
      region: { type: "county" as const, external_id: "06019" },
    };

    await t.step("the fixture matches the schema", () => {
      validatePlace(placeData);
    });

    await t.step("sends the place and only the filters given", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        const result = await getPesticidesForPlace(county, {
          chemical: "gs65e",
          year__gte: 2022,
        });
        const { pathname, searchParams } = stub.calls[0].url;
        assertEquals(pathname, "/api/2.0/pesticides/place/");
        assertEquals(
          [...searchParams.keys()].sort(),
          ["chemical", "region", "region_type", "year__gte"],
        );
        assertEquals(searchParams.get("region_type"), "county");
        assertEquals(searchParams.get("region"), "06019");
        assertEquals(searchParams.get("chemical"), "gs65e");
        assertEquals(searchParams.get("year__gte"), "2022");
        assertEquals(result.years[0].year, 2022);
      } finally {
        stub.restore();
      }
    });

    await t.step(
      "sends ids, narrow, method none and a list of categories",
      async () => {
        const stub = stubFetch(() => jsonResponse(placeFixture));
        try {
          await getPesticidesForPlace(county, {
            product: "6ezxm",
            commodity: "9xvrg",
            narrow: "concern",
            aerial_ground: "none",
            category: ["carcinogen", "fumigant"],
          });
          const { searchParams } = stub.calls[0].url;
          assertEquals(searchParams.getAll("category"), [
            "carcinogen",
            "fumigant",
          ]);
          assertEquals(searchParams.get("product"), "6ezxm");
          assertEquals(searchParams.get("commodity"), "9xvrg");
          assertEquals(searchParams.get("narrow"), "concern");
          assertEquals(searchParams.get("aerial_ground"), "none");
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("one category is sent once", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        await getPesticidesForPlace(county, { category: "carcinogen" });
        assertEquals(stub.calls[0].url.searchParams.getAll("category"), [
          "carcinogen",
        ]);
      } finally {
        stub.restore();
      }
    });

    await t.step(
      "an empty category list and undefined values are not sent",
      async () => {
        const stub = stubFetch(() => jsonResponse(placeFixture));
        try {
          await getPesticidesForPlace(county, {
            category: [],
            narrow: undefined,
            year__gte: 2022,
          });
          assertEquals(
            [...stub.calls[0].url.searchParams.keys()].sort(),
            ["region", "region_type", "year__gte"],
          );
        } finally {
          stub.restore();
        }
      },
    );

    await t.step("GET  pesticides/place/ for Fresno County", async () => {
      try {
        const result = await getPesticidesForPlace(county, {
          year__gte: 2022,
        });
        validatePlace(result);
        assert(result.years.length > 0);
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("pesticides/place/ unavailable; skipping.");
      }
    });
  },
});

Deno.test("Module: pesticide row schemas", async (t) => {
  // A chemical row as pesticides/chemicals/ sends it (Sulfur, on the local stack).
  const chemical = {
    id: "gs65e",
    chem_code: 560,
    name: "SULFUR",
    preferred_name: "Sulfur",
    display_name: "Sulfur",
    cas_number: "7704-34-9",
    dtxsid: "DTXSID9034941",
    iarc_group: "",
    categories: [],
    placeholder: false,
  };

  await t.step("a chemical with the new fields parses", () => {
    assertEquals(chemicalSchema.safeParse(chemical).success, true);
  });

  for (const field of ["preferred_name", "display_name", "placeholder"]) {
    await t.step(`a chemical without ${field} is rejected`, () => {
      const { [field]: _, ...rest } = chemical as Record<string, unknown>;
      assertEquals(chemicalSchema.safeParse(rest).success, false);
    });
  }

  await t.step("a product needs cdpr_fumigant", () => {
    const product = {
      id: "rhfum",
      prodno: 76126,
      reg_number: "45385-99-AA-92116",
      name: "$AVERPAK INSECTGUARD",
      fumigant: false,
      california_restricted: false,
    };
    assertEquals(productSchema.safeParse(product).success, false);
    assertEquals(
      productSchema.safeParse({ ...product, cdpr_fumigant: false }).success,
      true,
    );
  });
});

Deno.test("Module: pesticide place filter errors", async (t) => {
  const county = {
    region: { type: "county" as const, external_id: "06019" },
  };
  // The shape the HTTP layer throws for a failed request.
  const failed = (status: number, details: unknown) =>
    new Error("Request failed", { cause: { result: { status }, details } });
  const issue = (code: string) => [{ message: "m", code }];

  await t.step("returns the first code of each place field", () => {
    const error = failed(400, {
      chemical: [
        { message: "a", code: "not_found" },
        { message: "b", code: "invalid" },
      ],
      year__gte: issue("min_value"),
      __all__: issue("x"),
    });
    assertEquals(pesticidePlaceFilterErrors(error), {
      chemical: "not_found",
      year__gte: "min_value",
    });
  });

  await t.step("undefined when only unknown fields are named", () => {
    assertEquals(
      pesticidePlaceFilterErrors(failed(400, { __all__: issue("x") })),
      undefined,
    );
  });

  await t.step("undefined for anything that isn't a filter 400", () => {
    for (
      const error of [
        failed(404, { chemical: issue("invalid") }),
        failed(400, undefined),
        "why",
        new DOMException("", "AbortError"),
        new Error("x"),
        undefined,
      ]
    ) {
      assertEquals(pesticidePlaceFilterErrors(error), undefined);
    }
  });

  await t.step("a 400 through getPesticidesForPlace", async () => {
    const stub = stubFetch(() =>
      new Response(
        JSON.stringify({
          errors: {
            chemical: [
              { message: "No chemical has this id.", code: "not_found" },
            ],
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    );
    try {
      const error = await getPesticidesForPlace(county, { chemical: "gs65e" })
        .then(() => undefined, (e) => e);
      assertEquals(pesticidePlaceFilterErrors(error), {
        chemical: "not_found",
      });
    } finally {
      stub.restore();
    }
  });

  await t.step("an abort is not a filter error", async () => {
    const stub = stubFetch(() => jsonResponse(placeFixture));
    const controller = new AbortController();
    controller.abort();
    try {
      const error = await getPesticidesForPlace(county, {}, {
        signal: controller.signal,
      }).then(() => undefined, (e) => e);
      assert(error === controller.signal.reason);
      assertEquals(pesticidePlaceFilterErrors(error), undefined);
    } finally {
      stub.restore();
    }
  });

  await t.step(
    "GET  pesticides/place/: an over-long id is invalid",
    async () => {
      try {
        const error = await getPesticidesForPlace(county, {
          chemical: "z".repeat(33),
        }).then(() => undefined, (e) => e);
        if (isUnavailable(error)) {
          console.warn("pesticides/place/ unavailable; skipping.");
          return;
        }
        assertEquals(pesticidePlaceFilterErrors(error), {
          chemical: "invalid",
        });
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("pesticides/place/ unavailable; skipping.");
      }
    },
  );
});
