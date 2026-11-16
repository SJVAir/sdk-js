import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { assert, assertEquals, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import noticesFixture from "./fixtures/active_pesticide_notices.json" with {
  type: "json",
};
import { getActivePesticideNotices } from "./get_active_pesticide_notices.ts";
import { activePesticideNoticeFeatureSchema } from "./schemas/mod.ts";
import type { ActivePesticideNoticeFeature } from "./types.ts";

// Captured from notices/active/?date=2026-09-20 on the local stack, trimmed to
// three features.
if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}

const validateFeature = getSimpleValidationTest(
  activePesticideNoticeFeatureSchema,
);
const features = noticesFixture.features as unknown as Array<
  ActivePesticideNoticeFeature
>;

async function urlFor(
  params?: Parameters<typeof getActivePesticideNotices>[0],
): Promise<URL> {
  const stub = stubFetch(() => jsonResponse(noticesFixture));
  try {
    await getActivePesticideNotices(params);
    assertEquals(stub.calls.length, 1);
    return stub.calls[0].url;
  } finally {
    stub.restore();
  }
}

Deno.test("notices fixture matches the schema", () => {
  validateFeature(features);
});

Deno.test("a notice without past parses", () => {
  const { past: _, ...properties } = features[0].properties;
  const parsed = activePesticideNoticeFeatureSchema.safeParse({
    ...features[0],
    properties,
  });
  assertEquals(parsed.success, true);
});

Deno.test("a notice without scheduled_end fails the schema", () => {
  const { scheduled_end: _, ...properties } = features[0].properties;
  const parsed = activePesticideNoticeFeatureSchema.safeParse({
    ...features[0],
    properties,
  });
  assertEquals(parsed.success, false);
});

Deno.test("getActivePesticideNotices calls notices/active/", async () => {
  const stub = stubFetch(() => jsonResponse(noticesFixture));
  try {
    const result = await getActivePesticideNotices();
    assertEquals(
      stub.calls[0].url.pathname,
      "/api/2.0/pesticides/notices/active/",
    );
    assertEquals(result.type, "FeatureCollection");
    assertEquals(result.as_of, noticesFixture.as_of);
    assertEquals(result.features.length, 3);
  } finally {
    stub.restore();
  }
});

Deno.test("getActivePesticideNotices sends every param as the server spells it", async () => {
  const { searchParams } = await urlFor({
    bbox: [-119.9, 36.7, -119.7, 36.85],
    region: "abc12",
    buffer: 3,
    date: "2026-11-14",
    chemical_id: "gs65e",
    product_id: "p1x2y",
    county: "fresno",
    narrow: "concern",
    aerial_ground: "A",
    category: "fumigant",
    iarc_group: "2A",
  });
  assertEquals(Object.fromEntries(searchParams), {
    bbox: "-119.9,36.7,-119.7,36.85",
    region: "abc12",
    buffer: "3",
    date: "2026-11-14",
    chemical_id: "gs65e",
    product_id: "p1x2y",
    county: "fresno",
    narrow: "concern",
    aerial_ground: "A",
    category: "fumigant",
    iarc_group: "2A",
  });
  for (const key of ["chemical", "product", "commodity", "method"]) {
    assertEquals(searchParams.has(key), false);
  }
});

Deno.test("a category array is sent as repeated params", async () => {
  const { searchParams } = await urlFor({
    category: ["fumigant", "california_restricted"],
  });
  assertEquals(searchParams.getAll("category"), [
    "fumigant",
    "california_restricted",
  ]);
});

Deno.test("unset params are not sent", async () => {
  const url = await urlFor();
  assertEquals(url.search, "");
  const withUndefined = await urlFor({ date: undefined, county: "fresno" });
  assertEquals(withUndefined.search, "?county=fresno");
});

Deno.test("empty strings are not sent", async () => {
  const url = await urlFor({ date: "", county: "", category: "fumigant" });
  assertEquals(url.search, "?category=fumigant");
});

Deno.test("a 400 carries the server's message", async () => {
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ error: "date must be YYYY-MM-DD" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  );
  try {
    const error = await assertRejects(() =>
      getActivePesticideNotices({ date: "2026-13-01" })
    );
    const cause = (error as {
      cause: { result: { status: number; body: { error: string } } };
    }).cause;
    assertEquals(cause.result.status, 400);
    assertEquals(cause.result.body.error, "date must be YYYY-MM-DD");
  } finally {
    stub.restore();
  }
});

Deno.test("the signal is passed through", async () => {
  const stub = stubFetch(() => jsonResponse(noticesFixture));
  try {
    const controller = new AbortController();
    controller.abort("stop");
    const reason = await getActivePesticideNotices({
      signal: controller.signal,
    }).catch((e) => e);
    assertEquals(reason, "stop");
  } finally {
    stub.restore();
  }
});

Deno.test("past is a boolean when a date is given", async () => {
  const stub = stubFetch(() => jsonResponse(noticesFixture));
  try {
    const dated = await getActivePesticideNotices({ date: "2026-11-14" });
    const past: boolean = dated.features[0].properties.past;
    assert(typeof past === "boolean");

    const undated = await getActivePesticideNotices();
    // @ts-expect-error: without a date the server leaves `past` out
    const maybe: boolean = undated.features[0].properties.past;
    assertEquals(typeof maybe, "boolean");
  } finally {
    stub.restore();
  }
});

function pacificToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(new Date());
}

// Local notice data can end weeks back, so a dated day may be empty there;
// every feature returned must still match the schema and carry `past`.
for (const date of [pacificToday(), "2026-09-20"]) {
  Deno.test(`GET  pesticides/notices/active/?date=${date}`, async () => {
    try {
      const result = await getActivePesticideNotices({ date });
      validateFeature(result.features);
      for (const feature of result.features) {
        assertEquals(typeof feature.properties.past, "boolean");
      }
      if (result.features.length === 0) {
        console.warn(`no notices for ${date} on this server.`);
      }
    } catch (error) {
      if (!isUnavailable(error)) throw error;
      console.warn("pesticides/notices/active/ unavailable; skipping.");
    }
  });
}

Deno.test("GET  pesticides/notices/active/ with a bad date is a 400", async () => {
  try {
    const error = await assertRejects(() =>
      getActivePesticideNotices({ date: "2026-13-01" })
    );
    if (isUnavailable(error)) {
      console.warn("pesticides/notices/active/ unavailable; skipping.");
      return;
    }
    const result = (error as {
      cause: { result: { status: number; body: { error: unknown } } };
    }).cause.result;
    assertEquals(result.status, 400);
    assertEquals(typeof result.body.error, "string");
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    console.warn("pesticides/notices/active/ unavailable; skipping.");
  }
});
