import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { assertEquals, assertRejects } from "@std/assert";
import geojsonFixture from "./fixtures/regions_geojson.json" with {
  type: "json",
};
import { getRegionsGeoJSON } from "./get_regions_geojson.ts";

const [template] = geojsonFixture.features;

const codes = (n: number) =>
  Array.from({ length: n }, (_, i) => String(i).padStart(5, "0"));

/** Answers each request with one feature per requested code. */
function echoFeatures(url: URL): Response {
  const requested = url.searchParams.get("external_id")!.split(",");
  return jsonResponse({
    type: "FeatureCollection",
    features: requested.map((code) => ({
      ...template,
      id: `id-${code}`,
      properties: { ...template.properties, external_id: code },
    })),
  });
}

const requestedCodes = (stub: { calls: Array<{ url: URL }> }) =>
  stub.calls.map(({ url }) => url.searchParams.get("external_id")!.split(","));

Deno.test("getRegionsGeoJSON splits 250 codes into 3 requests and merges them", async () => {
  const stub = stubFetch(echoFeatures);
  try {
    const wanted = codes(250);
    const collection = await getRegionsGeoJSON({
      type: "zipcode",
      external_id: wanted,
      simplify: true,
    });
    assertEquals(requestedCodes(stub), [
      wanted.slice(0, 100),
      wanted.slice(100, 200),
      wanted.slice(200),
    ]);
    for (const { url } of stub.calls) {
      assertEquals(url.pathname.endsWith("/regions/geojson/"), true);
      assertEquals(url.searchParams.get("type"), "zipcode");
      assertEquals(url.searchParams.get("simplify"), "1");
    }
    assertEquals(collection.type, "FeatureCollection");
    assertEquals(
      collection.features.map((f) => f.properties.external_id),
      wanted,
    );
    assertEquals(collection.features[0].id, "id-00000");
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON sends 100 codes, a code string, or no codes in one request", async () => {
  const stub = stubFetch(echoFeatures);
  try {
    await getRegionsGeoJSON({ type: "county", external_id: codes(100) });
    assertEquals(stub.calls.length, 1);
    await getRegionsGeoJSON({ type: "county", external_id: "06019" });
    assertEquals(stub.calls.length, 2);
    assertEquals(stub.calls[1].url.searchParams.get("external_id"), "06019");
    await getRegionsGeoJSON({ type: "county", external_id: codes(101) });
    assertEquals(stub.calls.length, 4);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON without codes sends one request with no external_id", async () => {
  const stub = stubFetch(() => jsonResponse(geojsonFixture));
  try {
    const collection = await getRegionsGeoJSON({ type: "county" });
    assertEquals(stub.calls.length, 1);
    assertEquals(stub.calls[0].url.searchParams.has("external_id"), false);
    assertEquals(collection.features.length, 2);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON returns an empty collection for no codes, without a request", async () => {
  const stub = stubFetch(echoFeatures);
  try {
    const collection = await getRegionsGeoJSON({
      type: "county",
      external_id: [],
    });
    assertEquals(collection, { type: "FeatureCollection", features: [] });
    assertEquals(stub.calls.length, 0);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON passes the signal to every chunk", async () => {
  const controller = new AbortController();
  const stub = stubFetch((url, _init, call) => {
    if (call === 0) controller.abort("stop");
    return echoFeatures(url);
  });
  try {
    const reason = await getRegionsGeoJSON(
      { type: "county", external_id: codes(250) },
      { signal: controller.signal },
    ).then(() => "resolved", (e) => e);
    assertEquals(reason, "stop");
    assertEquals(stub.calls.length, 3);
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionsGeoJSON rejects when one chunk fails", async () => {
  const stub = stubFetch((url, _init, call) =>
    call === 2 ? new Response("boom", { status: 500 }) : echoFeatures(url)
  );
  try {
    await assertRejects(() =>
      getRegionsGeoJSON({ type: "county", external_id: codes(250) })
    );
  } finally {
    stub.restore();
  }
});
