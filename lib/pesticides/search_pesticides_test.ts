import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { assertEquals } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import chemicalFixture from "./fixtures/pesticide_search_chemical.json" with {
  type: "json",
};
import commodityFixture from "./fixtures/pesticide_search_commodity.json" with {
  type: "json",
};
import {
  chemicalSearchHitSchema,
  pesticideSearchHitSchema,
} from "./schemas/mod.ts";
import { searchPesticides } from "./search_pesticides.ts";

if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateChemicalHit = getSimpleValidationTest(chemicalSearchHitSchema);
const validateHit = getSimpleValidationTest(pesticideSearchHitSchema);

Deno.test("search fixtures match the schemas", () => {
  validateChemicalHit(chemicalFixture.results);
  validateHit(commodityFixture.results);
  assertEquals(typeof chemicalFixture.more, "boolean");
  assertEquals(typeof commodityFixture.more, "boolean");
});

Deno.test("searchPesticides sends type, q, limit, year, county and narrow", async () => {
  const stub = stubFetch(() => jsonResponse(chemicalFixture));
  try {
    await searchPesticides({
      type: "chemical",
      q: " sulf ",
      limit: 5,
      year: 2022,
      county: "fresno",
      narrow: "concern",
    });
    const { url } = stub.calls[0];
    assertEquals(url.pathname.endsWith("/pesticides/search/"), true);
    assertEquals(url.searchParams.get("type"), "chemical");
    assertEquals(url.searchParams.get("q"), "sulf");
    assertEquals(url.searchParams.get("limit"), "5");
    assertEquals(url.searchParams.get("year"), "2022");
    assertEquals(url.searchParams.get("county"), "fresno");
    assertEquals(url.searchParams.get("narrow"), "concern");
  } finally {
    stub.restore();
  }
});

Deno.test("searchPesticides sends year all as all", async () => {
  const stub = stubFetch(() => jsonResponse(chemicalFixture));
  try {
    await searchPesticides({ type: "chemical", q: "sulf", year: "all" });
    assertEquals(stub.calls[0].url.searchParams.get("year"), "all");
  } finally {
    stub.restore();
  }
});

Deno.test("searchPesticides leaves out unset and undefined params", async () => {
  const stub = stubFetch(() => jsonResponse({ results: [], more: false }));
  try {
    await searchPesticides({ type: "product", q: "round", narrow: undefined });
    assertEquals([...stub.calls[0].url.searchParams.keys()].sort(), [
      "q",
      "type",
    ]);
  } finally {
    stub.restore();
  }
});

Deno.test("searchPesticides sends nothing for a short or blank q", async () => {
  const stub = stubFetch(() => jsonResponse(chemicalFixture));
  try {
    for (const q of ["s", "   ", " s "]) {
      assertEquals(await searchPesticides({ type: "chemical", q }), {
        results: [],
        more: false,
      });
    }
    assertEquals(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

Deno.test("searchPesticides returns results and more from the top level", async () => {
  const stub = stubFetch(() => jsonResponse(chemicalFixture));
  try {
    const result = await searchPesticides({ type: "chemical", q: "sulf" });
    assertEquals(result, {
      results: chemicalFixture.results,
      more: chemicalFixture.more,
    });
    // Only chemical hits carry `placeholder`, and the types say so.
    const flag: boolean = result.results[0].placeholder;
    assertEquals(flag, false);
  } finally {
    stub.restore();
  }
});

Deno.test("commodity hits have no placeholder in their type", async () => {
  const stub = stubFetch(() => jsonResponse(commodityFixture));
  try {
    const result = await searchPesticides({ type: "commodity", q: "wheat" });
    // @ts-expect-error: only chemical hits have `placeholder`
    assertEquals(result.results[0].placeholder, undefined);
  } finally {
    stub.restore();
  }
});

Deno.test("GET  pesticides/search/: chemical sulf leads with Sulfur", async () => {
  try {
    const result = await searchPesticides({ type: "chemical", q: "sulf" });
    validateChemicalHit(result.results);
    assertEquals(result.results[0].name, "Sulfur");
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    console.warn("pesticides/search/ unavailable; skipping.");
  }
});
