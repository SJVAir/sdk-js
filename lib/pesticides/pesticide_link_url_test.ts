import { assertEquals } from "@std/assert";
import metaFixture from "./fixtures/pesticides_meta.json" with {
  type: "json",
};
import { pesticideLinkUrl } from "./pesticide_link_url.ts";
import type { PesticideLinkParam, PesticidesMeta } from "./types.ts";

const meta = metaFixture.data as unknown as PesticidesMeta;
const origin = "http://127.0.0.1:8000/tools/pesticides";

function metaWith(
  template: string,
  params: Array<PesticideLinkParam>,
): Pick<PesticidesMeta, "links" | "link_params"> {
  return {
    links: { ...meta.links, section_page: template },
    link_params: { ...meta.link_params, section_page: params },
  };
}

Deno.test("pesticideLinkUrl fills {id} and nothing else without values", () => {
  assertEquals(
    pesticideLinkUrl(meta, "section_page", "nyh2u"),
    `${origin}/sections/nyh2u/`,
  );
  assertEquals(
    pesticideLinkUrl(meta, "section_notices_past", "nyh2u", {}),
    `${origin}/notices/?section=nyh2u&past=1`,
  );
});

Deno.test("pesticideLinkUrl appends with ? when the template has no query", () => {
  assertEquals(
    pesticideLinkUrl(meta, "chemical_page", "bca8f", {
      year: 2023,
      narrow: "concern",
    }),
    `${origin}/chemicals/bca8f/?year=2023&narrow=concern`,
  );
});

Deno.test("pesticideLinkUrl appends in link_params order, under each param", () => {
  assertEquals(
    pesticideLinkUrl(meta, "section_records", "nyh2u", {
      narrow: "concern",
      aerial_ground: "A",
      chemical_id: "k3x9a",
      month_end: "2023-06-30",
      month_start: "2023-06-01",
      year: 2023,
    }),
    `${origin}/records/?section=nyh2u&year=2023&start=2023-06-01` +
      "&end=2023-06-30&chemical=k3x9a&method=A&narrow=concern",
  );
});

Deno.test("pesticideLinkUrl takes only the values a link lists", () => {
  assertEquals(
    pesticideLinkUrl(meta, "section_notices_past", "nyh2u", {
      year: 2023,
      commodity_id: "6cxb7",
      aerial_ground: "G",
      notices_year: 2026,
      notices_month: 3,
      product_id: "p1",
    }),
    `${origin}/notices/?section=nyh2u&past=1&archive_year=2026&month=3` +
      "&product=p1",
  );
});

Deno.test("pesticideLinkUrl skips undefined, null and empty values", () => {
  assertEquals(
    pesticideLinkUrl(meta, "section_notices", "nyh2u", {
      chemical_id: "",
      product_id: undefined,
    }),
    `${origin}/notices/?section=nyh2u`,
  );
  assertEquals(
    pesticideLinkUrl(meta, "section_page", "nyh2u", {
      year: null,
      narrow: "concern",
    }),
    `${origin}/sections/nyh2u/?narrow=concern`,
  );
});

Deno.test("pesticideLinkUrl keeps year 'all' and zero", () => {
  assertEquals(
    pesticideLinkUrl(meta, "section_page", "nyh2u", { year: "all" }),
    `${origin}/sections/nyh2u/?year=all`,
  );
  const zero = metaWith("https://x.test/{id}/", [
    { param: "n", from: "notices_month" },
  ]);
  assertEquals(
    pesticideLinkUrl(zero, "section_page", "a", { notices_month: 0 }),
    "https://x.test/a/?n=0",
  );
});

Deno.test("pesticideLinkUrl encodes the id, params and values", () => {
  const odd = metaWith("https://x.test/{id}/?a=1", [
    { param: "q&r", from: "chemical_id" },
  ]);
  assertEquals(
    pesticideLinkUrl(odd, "section_page", "a/b c", {
      chemical_id: "x&y=z ü",
    }),
    "https://x.test/a%2Fb%20c/?a=1&q%26r=x%26y%3Dz%20%C3%BC",
  );
});

Deno.test("pesticideLinkUrl fills an unknown source only when given", () => {
  const newer = metaWith("https://x.test/{id}/", [
    { param: "week", from: "week" },
    { param: "year", from: "year" },
  ]);
  assertEquals(
    pesticideLinkUrl(newer, "section_page", "a", { year: 2023 }),
    "https://x.test/a/?year=2023",
  );
  assertEquals(
    pesticideLinkUrl(newer, "section_page", "a", { week: 5, year: 2023 }),
    "https://x.test/a/?week=5&year=2023",
  );
});

Deno.test("pesticideLinkUrl replaces every {id}", () => {
  const twice = metaWith("https://x.test/{id}/?s={id}", []);
  assertEquals(
    pesticideLinkUrl(twice, "section_page", "a"),
    "https://x.test/a/?s=a",
  );
});
