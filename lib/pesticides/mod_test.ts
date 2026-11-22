import { apiCall, setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { assert, assertEquals, assertExists, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import metaFixture from "./fixtures/pesticides_meta.json" with {
  type: "json",
};
import { getPesticidesMeta } from "./get_pesticides_meta.ts";
import placeFixture from "./fixtures/pesticides_for_place.json" with {
  type: "json",
};
import valleyFixture from "./fixtures/pesticides_for_place_valley.json" with {
  type: "json",
};
import type { Place } from "../meta/types.ts";
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
  pesticidesMetaSchema,
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
import type {
  PesticidesForPlace,
  PesticidesMeta,
  PesticideUseData,
} from "./types.ts";

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

    await t.step("the valley fixture matches the schema", () => {
      validatePlace(valleyFixture.data as unknown as PesticidesForPlace);
    });

    await t.step("null asks for the valley: no place params", async () => {
      const stub = stubFetch(() => jsonResponse(valleyFixture));
      try {
        const result = await getPesticidesForPlace(null, { year__gte: 2022 });
        assertEquals(
          [...stub.calls[0].url.searchParams.keys()],
          ["year__gte"],
        );
        assertEquals(result.place, null);
      } finally {
        stub.restore();
      }
    });

    await t.step(
      "a place types `place` as non-null; null as null",
      async () => {
        const stub = stubFetch(() => jsonResponse(placeFixture));
        try {
          const named: Place = (await getPesticidesForPlace(county)).place;
          assertExists(named);
          // @ts-expect-error The valley's `place` is null, not a Place.
          const valley: Place = (await getPesticidesForPlace(null)).place;
          assertExists(valley); // the stub answers with the county fixture
        } finally {
          stub.restore();
        }
      },
    );

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

    await t.step("a read-only list of categories is accepted", async () => {
      const stub = stubFetch(() => jsonResponse(placeFixture));
      try {
        const keys = Object.freeze(["carcinogen", "fumigant"] as const);
        await getPesticidesForPlace(county, { category: keys });
        assertEquals(stub.calls[0].url.searchParams.getAll("category"), [
          "carcinogen",
          "fumigant",
        ]);
      } finally {
        stub.restore();
      }
    });

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

    await t.step("GET  pesticides/place/ for the valley", async () => {
      try {
        const result = await getPesticidesForPlace(null, { year__gte: 2022 });
        validatePlace(result);
        assertEquals(result.place, null);
        if (!result.years.length) {
          console.warn("No valley pesticide use since 2022 (local data gap)");
        }
      } catch (error) {
        if (!isUnavailable(error)) throw error;
        console.warn("pesticides/place/ unavailable; skipping.");
      }
    });

    // The SDK can't build half a region; the server still refuses one.
    await t.step(
      "GET  pesticides/place/ with half a region is a 400",
      async () => {
        const error = await assertRejects(() =>
          apiCall({
            url: "pesticides/place",
            searchParams: { region_type: "county" },
          })
        );
        const cause = (error as Error).cause as {
          result?: { status?: number };
        };
        assertEquals(cause.result?.status, 400);
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

  await t.step("a product needs cdpr_fumigant and display_name", () => {
    const product = {
      id: "rhfum",
      prodno: 76126,
      reg_number: "45385-99-AA-92116",
      name: "$AVERPAK INSECTGUARD",
      display_name: "$AVERPAK INSECTGUARD",
      fumigant: false,
      cdpr_fumigant: false,
      california_restricted: false,
    };
    assertEquals(productSchema.safeParse(product).success, true);
    for (const field of ["cdpr_fumigant", "display_name"]) {
      const { [field]: _, ...rest } = product as Record<string, unknown>;
      assertEquals(productSchema.safeParse(rest).success, false);
    }
  });

  await t.step("a commodity needs display_name", () => {
    const commodity = {
      id: "wv4qu",
      site_code: "22007",
      name: "WHEAT (FORAGE - FODDER)",
      display_name: "Wheat (forage - fodder)",
    };
    assertEquals(commoditySchema.safeParse(commodity).success, true);
    const { display_name: _, ...rest } = commodity;
    assertEquals(commoditySchema.safeParse(rest).success, false);
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

  await t.step("leaves out codes a field can't have", () => {
    const error = failed(400, {
      chemical: issue("required"),
      category: issue("not_found"),
      commodity: issue("not_found"),
    });
    assertEquals(pesticidePlaceFilterErrors(error), { commodity: "not_found" });
    assertEquals(
      pesticidePlaceFilterErrors(failed(400, { chemical: issue("required") })),
      undefined,
    );
  });

  await t.step(
    "an abort while the request is pending is not a filter error",
    async () => {
      const stub = stubFetch((_url, init) =>
        new Promise<Response>((_, reject) =>
          init.signal?.addEventListener(
            "abort",
            () => reject(init.signal!.reason),
          )
        )
      );
      const controller = new AbortController();
      try {
        const pending = getPesticidesForPlace(county, {}, {
          signal: controller.signal,
        }).then(() => undefined, (e) => e);
        await new Promise((resolve) => setTimeout(resolve, 0));
        assertEquals(stub.calls.length, 1);
        controller.abort("why");
        const error = await pending;
        assertEquals(error, "why");
        assertEquals(pesticidePlaceFilterErrors(error), undefined);
      } finally {
        stub.restore();
      }
    },
  );

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

Deno.test("Module: pesticides meta", async (t) => {
  const validateMeta = getSimpleValidationTest(pesticidesMetaSchema);
  const meta = metaFixture.data as unknown as PesticidesMeta;

  await t.step("the fixture matches the schema", () => {
    validateMeta(meta);
    assertEquals(meta.categories.length, 10);
    assert(meta.categories.some((category) => !category.in_use));
    assertEquals(meta.methods.map((method) => method.key), [
      "G",
      "A",
      "F",
      "O",
      "none",
    ]);
    assert(meta.placeholder_chemicals.length > 0);
  });

  await t.step("a category without in_use is rejected", () => {
    const { in_use: _, ...category } = meta.categories[0];
    const parsed = pesticidesMetaSchema.safeParse({
      ...meta,
      categories: [category],
    });
    assertEquals(parsed.success, false);
  });

  await t.step("badges are in display order and resolve to notes", () => {
    assertEquals(meta.badges.map((badge) => badge.key), [
      "prop65",
      "carb_tac",
      "iarc_1",
      "iarc_2a",
      "iarc_2b",
      "iarc_3",
      "california_restricted",
    ]);
    for (const badge of meta.badges) assertExists(meta.notes[badge.note]);
  });

  await t.step("notes carry their key", () => {
    for (const [key, note] of Object.entries(meta.notes)) {
      assertEquals(note.key, key);
    }
  });

  await t.step("years are newest first", () => {
    assert(meta.years.length > 0);
    assertEquals(meta.years, [...meta.years].sort((a, b) => b - a));
  });

  await t.step("ramp has colors and no_data", () => {
    assertEquals(meta.ramp.colors.length, 8);
    assertEquals(meta.ramp.no_data, "#f0f0f0");
    assertExists(meta.notes.shades_valley);
  });

  await t.step("scales has the spray-notice scale", () => {
    const scale = meta.scales["spray-notice"];
    assertExists(scale);
    assertEquals(scale.kind, "category");
    assertEquals(scale.levels.map((level) => level.key), ["notice"]);
  });

  for (
    const field of [
      "notes",
      "badges",
      "links",
      "link_params",
      "notice_filters",
      "years",
      "ramp",
      "scales",
    ] as const
  ) {
    await t.step(`meta without ${field} is rejected`, () => {
      const { [field]: _, ...rest } = meta;
      assertEquals(pesticidesMetaSchema.safeParse(rest).success, false);
    });
  }

  await t.step("every explorer link has its params", () => {
    const keys = [
      "section_page",
      "section_records",
      "section_notices",
      "section_notices_past",
      "chemical_page",
    ];
    assertEquals(Object.keys(meta.link_params).sort(), [...keys].sort());
    for (const key of keys) {
      const template = meta.links[key as keyof typeof meta.links];
      assert(template.includes("{id}"), `${key} has no {id}`);
      assert(new URL(template).pathname.startsWith("/tools/pesticides/"));
    }
  });

  for (const link of ["section_page", "chemical_page"] as const) {
    await t.step(`meta without links.${link} is rejected`, () => {
      const { [link]: _, ...links } = meta.links;
      assertEquals(
        pesticidesMetaSchema.safeParse({ ...meta, links }).success,
        false,
      );
    });
  }

  await t.step("an unknown link param source parses", () => {
    const parsed = pesticidesMetaSchema.safeParse({
      ...meta,
      link_params: {
        ...meta.link_params,
        section_page: [
          ...meta.link_params.section_page,
          { param: "week", from: "week" },
        ],
      },
    });
    assertEquals(parsed.success, true);
  });

  await t.step("an unknown badge key and note parse", () => {
    const parsed = pesticidesMetaSchema.safeParse({
      ...meta,
      badges: [...meta.badges, {
        key: "new_list",
        label: "New",
        note: "new_list",
      }],
      notes: {
        ...meta.notes,
        new_list: {
          key: "new_list",
          title: "New list",
          summary: "A new list.",
          detail: null,
          source_url: "https://example.com/",
        },
      },
    });
    assertEquals(parsed.success, true);
  });

  await t.step("fetches pesticides/meta/", async () => {
    const stub = stubFetch(() => jsonResponse(metaFixture));
    try {
      const result = await getPesticidesMeta();
      assertEquals(stub.calls[0].url.pathname, "/api/2.0/pesticides/meta/");
      assertEquals(result, meta);
    } finally {
      stub.restore();
    }
  });

  await t.step("GET  pesticides/meta/", async () => {
    try {
      const result = await getPesticidesMeta();
      validateMeta(result);
      assertEquals(result.categories.length, 10);
    } catch (error) {
      if (!isUnavailable(error)) throw error;
      console.warn("pesticides/meta/ unavailable; skipping.");
    }
  });
});
