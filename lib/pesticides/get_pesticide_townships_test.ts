import { getSimpleValidationTest } from "$testing";
import { assertEquals, assertRejects } from "@std/assert";
import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import townshipsFixture from "./fixtures/pesticide_townships.json" with {
  type: "json",
};
import { getPesticideTownships } from "./get_pesticide_townships.ts";
import { pesticideTownshipCollectionSchema } from "./schemas/mod.ts";
import type { PesticideTownshipCollection } from "./types.ts";

// Built by hand from sjvair.com feature/pesticide-map-classes (sections.py);
// replaced by a captured response once server PR 2 is live locally.
const validateCollection = getSimpleValidationTest(
  pesticideTownshipCollectionSchema,
);
const bbox: [number, number, number, number] = [-119.9, 36.7, -119.7, 36.85];

async function urlFor(
  params?: Parameters<typeof getPesticideTownships>[0],
): Promise<URL> {
  const stub = stubFetch(() => jsonResponse(townshipsFixture));
  try {
    await getPesticideTownships(params);
    assertEquals(stub.calls.length, 1);
    return stub.calls[0].url;
  } finally {
    stub.restore();
  }
}

Deno.test("townships fixture matches the schema", () => {
  validateCollection(
    townshipsFixture as unknown as PesticideTownshipCollection,
  );
  assertEquals(townshipsFixture.features[0].id, "MDM-T14S-R20E");
});

Deno.test("null geometry and no classes parse", () => {
  const { classes: _, ...rest } = townshipsFixture;
  const parsed = pesticideTownshipCollectionSchema.safeParse({
    ...rest,
    features: rest.features.map((f) => ({ ...f, geometry: null })),
  });
  assertEquals(parsed.success, true);
});

Deno.test("a township without sections fails the schema", () => {
  const [first] = townshipsFixture.features;
  const { sections: _, ...properties } = first.properties;
  const parsed = pesticideTownshipCollectionSchema.safeParse({
    ...townshipsFixture,
    features: [{ ...first, properties }],
  });
  assertEquals(parsed.success, false);
});

Deno.test("getPesticideTownships calls townships/ with no params", async () => {
  const url = await urlFor();
  assertEquals(url.pathname, "/api/2.0/pesticides/townships/");
  assertEquals(url.search, "");
});

Deno.test("a bbox and a region are both sent", async () => {
  const { searchParams } = await urlFor({ bbox, region: "abc12", buffer: 3 });
  assertEquals(Object.fromEntries(searchParams), {
    bbox: "-119.9,36.7,-119.7,36.85",
    region: "abc12",
    buffer: "3",
  });
});

Deno.test("the use filters are sent", async () => {
  const { searchParams } = await urlFor({
    year: "all",
    month: 4,
    compare: 2022,
    county: "kern",
    category: "fumigant",
    iarc_group: "1",
    classes: true,
    geometry: false,
  });
  assertEquals(Object.fromEntries(searchParams), {
    year: "all",
    month: "4",
    compare: "2022",
    county: "kern",
    category: "fumigant",
    iarc_group: "1",
    classes: "1",
    geometry: "0",
  });
});

Deno.test("townships take no point", () => {
  const _point: Parameters<typeof getPesticideTownships>[0] = {
    // @ts-expect-error: townships/ has no lat/lng form
    lat: 36.7,
    lng: -119.8,
  };
});

Deno.test("classes are typed present when asked for", async () => {
  const stub = stubFetch(() => jsonResponse(townshipsFixture));
  try {
    const result = await getPesticideTownships({ classes: true });
    const breaks: number[] = result.classes.applications.breaks;
    assertEquals(breaks, []);

    const plain = await getPesticideTownships();
    // @ts-expect-error: without classes: true the server leaves classes out
    assertEquals(plain.classes.applications.min, null);
  } finally {
    stub.restore();
  }
});

Deno.test("a 400 carries the server's message", async () => {
  const stub = stubFetch(() =>
    new Response(JSON.stringify({ error: "Unknown category: x." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  );
  try {
    const error = await assertRejects(() =>
      getPesticideTownships({ category: "x" })
    );
    const { result } = (error as {
      cause: { result: { status: number; body: { error: string } } };
    }).cause;
    assertEquals(result.status, 400);
    assertEquals(result.body.error, "Unknown category: x.");
  } finally {
    stub.restore();
  }
});
