import { setOrigin } from "$http";
import { getSimpleValidationTest, isUnavailable } from "$testing";
import { assert, assertEquals, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import sectionsFixture from "./fixtures/pesticide_sections.json" with {
  type: "json",
};
import { getPesticideSections } from "./get_pesticide_sections.ts";
import {
  pesticideSectionCollectionSchema,
  pesticideUseClassesSchema,
} from "./schemas/mod.ts";
import type { PesticideSectionCollection } from "./types.ts";

// Captured from sections/?bbox=-119.9,36.7,-119.7,36.85&year=2023&classes=1
// on the local stack, trimmed to three features (the last has no use).
if (!Deno.env.has("TEST_REMOTE")) {
  setOrigin("http://127.0.0.1:8000");
}
const validateCollection = getSimpleValidationTest(
  pesticideSectionCollectionSchema,
);
const bbox: [number, number, number, number] = [-119.9, 36.7, -119.7, 36.85];

async function urlFor(
  params: Parameters<typeof getPesticideSections>[0],
): Promise<URL> {
  const stub = stubFetch(() => jsonResponse(sectionsFixture));
  try {
    await getPesticideSections(params);
    assertEquals(stub.calls.length, 1);
    return stub.calls[0].url;
  } finally {
    stub.restore();
  }
}

Deno.test("sections fixture matches the schema", () => {
  validateCollection(sectionsFixture as unknown as PesticideSectionCollection);
});

Deno.test("null geometry, null year and no classes parse", () => {
  const { classes: _, ...rest } = sectionsFixture;
  const parsed = pesticideSectionCollectionSchema.safeParse({
    ...rest,
    year: null,
    features: rest.features.map((f) => ({ ...f, geometry: null })),
  });
  assertEquals(parsed.success, true);
});

Deno.test("year all parses", () => {
  const parsed = pesticideSectionCollectionSchema.safeParse({
    ...sectionsFixture,
    year: "all",
  });
  assertEquals(parsed.success, true);
});

Deno.test("a feature with the compared year's totals parses", () => {
  const [first] = sectionsFixture.features;
  const parsed = pesticideSectionCollectionSchema.safeParse({
    ...sectionsFixture,
    features: [{
      ...first,
      properties: {
        ...first.properties,
        lbs_chemical_prev: 10,
        lbs_product_prev: 12,
        acres_treated_prev: 3,
        applications_prev: 1,
      },
    }],
  });
  assertEquals(parsed.success, true);
});

Deno.test("a section without applications fails the schema", () => {
  const [first] = sectionsFixture.features;
  const { applications: _, ...properties } = first.properties;
  const parsed = pesticideSectionCollectionSchema.safeParse({
    ...sectionsFixture,
    features: [{ ...first, properties }],
  });
  assertEquals(parsed.success, false);
});

Deno.test("getPesticideSections calls sections/", async () => {
  const url = await urlFor({ bbox });
  assertEquals(url.pathname, "/api/2.0/pesticides/sections/");
  assertEquals(url.searchParams.get("bbox"), "-119.9,36.7,-119.7,36.85");
});

Deno.test("year, month, classes and geometry are sent as the server spells them", async () => {
  const { searchParams } = await urlFor({
    bbox,
    year: 2023,
    month: 6,
    compare: 2022,
    classes: true,
    geometry: false,
  });
  assertEquals(Object.fromEntries(searchParams), {
    bbox: "-119.9,36.7,-119.7,36.85",
    year: "2023",
    month: "6",
    compare: "2022",
    classes: "1",
    geometry: "0",
  });
});

Deno.test("every value filter is sent", async () => {
  const { searchParams } = await urlFor({
    bbox,
    chemical_id: "gs65e",
    product_id: "p1x2y",
    commodity_id: "c9z8w",
    county: "fresno",
    aerial_ground: "A",
    narrow: "concern",
    category: ["fumigant", "california_restricted"],
    iarc_group: "2A",
  });
  assertEquals(searchParams.getAll("category"), [
    "fumigant",
    "california_restricted",
  ]);
  for (
    const [key, value] of [
      ["chemical_id", "gs65e"],
      ["product_id", "p1x2y"],
      ["commodity_id", "c9z8w"],
      ["county", "fresno"],
      ["aerial_ground", "A"],
      ["narrow", "concern"],
      ["iarc_group", "2A"],
    ]
  ) {
    assertEquals(searchParams.get(key), value);
  }
});

Deno.test("a point and radius are sent without a bbox", async () => {
  const { searchParams } = await urlFor({ lat: 36.7, lng: -119.8, radius: 3 });
  assertEquals(Object.fromEntries(searchParams), {
    lat: "36.7",
    lng: "-119.8",
    radius: "3",
  });
});

Deno.test("a region alone is an area", async () => {
  const { searchParams } = await urlFor({ region: "abc12", buffer: 1 });
  assertEquals(Object.fromEntries(searchParams), {
    region: "abc12",
    buffer: "1",
  });
});

Deno.test("year all is sent as all", async () => {
  const { searchParams } = await urlFor({ bbox, year: "all" });
  assertEquals(searchParams.get("year"), "all");
});

Deno.test("classes are typed present when asked for", async () => {
  const stub = stubFetch(() => jsonResponse(sectionsFixture));
  try {
    const result = await getPesticideSections({ bbox, classes: true });
    const breaks: number[] = result.classes.lbs_chemical.breaks;
    assertEquals(breaks.length, 8);

    const plain = await getPesticideSections({ bbox });
    // @ts-expect-error: without classes: true the server leaves classes out
    assertEquals(plain.classes.lbs_chemical.breaks.length, 8);
  } finally {
    stub.restore();
  }
});

Deno.test("an area is required", () => {
  // @ts-expect-error: sections/ needs a bbox, a point or a region
  const _noArea: Parameters<typeof getPesticideSections>[0] = { year: 2023 };
  const _badRadius: Parameters<typeof getPesticideSections>[0] = {
    lat: 36.7,
    lng: -119.8,
    // @ts-expect-error: radius is 1, 3 or 5
    radius: 2,
  };
});

Deno.test("a 400 carries the server's message", async () => {
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ error: "bbox too large; zoom in" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  );
  try {
    const error = await assertRejects(() =>
      getPesticideSections({ bbox: [-121, 35, -118, 38] })
    );
    const { result } = (error as {
      cause: { result: { status: number; body: { error: string } } };
    }).cause;
    assertEquals(result.status, 400);
    assertEquals(result.body.error, "bbox too large; zoom in");
  } finally {
    stub.restore();
  }
});

Deno.test("the signal is passed through", async () => {
  const stub = stubFetch(() => jsonResponse(sectionsFixture));
  try {
    const controller = new AbortController();
    controller.abort("stop");
    const reason = await getPesticideSections({
      bbox,
      signal: controller.signal,
    }).catch((e) => e);
    assertEquals(reason, "stop");
  } finally {
    stub.restore();
  }
});

Deno.test("a class with no positive values parses", () => {
  const parsed = pesticideUseClassesSchema.safeParse({
    ...sectionsFixture.classes,
    acres_treated: { breaks: [], min: null },
  });
  assertEquals(parsed.success, true);
});

Deno.test("GET  pesticides/sections/ for a Fresno bbox", async () => {
  try {
    const result = await getPesticideSections({
      bbox,
      year: 2023,
      classes: true,
    });
    validateCollection(result);
    assert(result.features.length > 0);
    assertEquals(Object.keys(result.classes).sort(), [
      "acres_treated",
      "applications",
      "lbs_chemical",
    ]);
    const values = await getPesticideSections({
      bbox,
      year: 2023,
      geometry: false,
    });
    validateCollection(values);
    assert(values.features.every((feature) => feature.geometry === null));
    assertEquals(values.classes, undefined);
  } catch (error) {
    if (!isUnavailable(error)) throw error;
    console.warn("pesticides/sections/ unavailable; skipping.");
  }
});

Deno.test("GET  pesticides/sections/ with no area is a 400", async () => {
  const error = await assertRejects(() =>
    getPesticideSections({} as Parameters<typeof getPesticideSections>[0])
  );
  if (isUnavailable(error)) return;
  const { result } = (error as {
    cause: { result: { status: number; body: { error: unknown } } };
  }).cause;
  assertEquals(result.status, 400);
  assertEquals(typeof result.body.error, "string");
});
