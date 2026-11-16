import { getSimpleValidationTest } from "$testing";
import { assertEquals, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import detailFixture from "./fixtures/pesticide_section_detail.json" with {
  type: "json",
};
import { getPesticideSectionDetails } from "./get_pesticide_section_details.ts";
import { pesticideSectionDetailSchema } from "./schemas/mod.ts";
import type { PesticideSectionDetail } from "./types.ts";

// Built by hand from sjvair.com feature/pesticide-map-classes (sections.py);
// replaced by a captured response once server PR 2 is live locally.
const validateDetail = getSimpleValidationTest(pesticideSectionDetailSchema);
const detail = detailFixture as unknown as PesticideSectionDetail;

async function urlFor(
  ...args: Parameters<typeof getPesticideSectionDetails>
): Promise<URL> {
  const stub = stubFetch(() => jsonResponse(detailFixture));
  try {
    await getPesticideSectionDetails(...args);
    assertEquals(stub.calls.length, 1);
    return stub.calls[0].url;
  } finally {
    stub.restore();
  }
}

Deno.test("section detail fixture matches the schema", () => {
  validateDetail(detail);
  assertEquals(detail.months.length, 12);
  assertEquals(detail.top_chemicals[0].badges, ["prop65", "iarc_2b"]);
});

Deno.test("null geometry, county and year parse", () => {
  const parsed = pesticideSectionDetailSchema.safeParse({
    ...detail,
    geometry: null,
    county: null,
    year: null,
  });
  assertEquals(parsed.success, true);
});

Deno.test("an unknown badge key parses", () => {
  const [first, ...rest] = detail.top_chemicals;
  const parsed = pesticideSectionDetailSchema.safeParse({
    ...detail,
    top_chemicals: [{ ...first, badges: ["new_list"] }, ...rest],
  });
  assertEquals(parsed.success, true);
});

Deno.test("a top chemical without badges fails the schema", () => {
  const [first, ...rest] = detail.top_chemicals;
  const { badges: _, ...chemical } = first;
  const parsed = pesticideSectionDetailSchema.safeParse({
    ...detail,
    top_chemicals: [chemical, ...rest],
  });
  assertEquals(parsed.success, false);
});

Deno.test("getPesticideSectionDetails calls sections/<id>/", async () => {
  const stub = stubFetch(() => jsonResponse(detailFixture));
  try {
    const result = await getPesticideSectionDetails("abc12");
    assertEquals(
      stub.calls[0].url.pathname,
      "/api/2.0/pesticides/sections/abc12/",
    );
    assertEquals(stub.calls[0].url.search, "");
    assertEquals(result, detail);
  } finally {
    stub.restore();
  }
});

Deno.test("year and narrow are sent", async () => {
  const { searchParams } = await urlFor("abc12", {
    year: "all",
    narrow: "concern",
  });
  assertEquals(Object.fromEntries(searchParams), {
    year: "all",
    narrow: "concern",
  });
});

Deno.test("a 404 rejects", async () => {
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ detail: "Not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  );
  try {
    const error = await assertRejects(() =>
      getPesticideSectionDetails("nope0")
    );
    const { result } = (error as { cause: { result: { status: number } } })
      .cause;
    assertEquals(result.status, 404);
  } finally {
    stub.restore();
  }
});

Deno.test("the signal is passed through", async () => {
  const stub = stubFetch(() => jsonResponse(detailFixture));
  try {
    const controller = new AbortController();
    controller.abort("stop");
    const reason = await getPesticideSectionDetails("abc12", undefined, {
      signal: controller.signal,
    }).catch((e) => e);
    assertEquals(reason, "stop");
  } finally {
    stub.restore();
  }
});
