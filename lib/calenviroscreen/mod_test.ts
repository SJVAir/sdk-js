import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { setOrigin } from "$http";
import { getSimpleValidationTest } from "$testing";
import { assertEquals } from "@std/assert";
import ces4Fixture from "./fixtures/ces4_list.json" with { type: "json" };
import ces5Fixture from "./fixtures/ces5_list.json" with { type: "json" };
import { getCalEnviroScreen } from "./get_calenviroscreen.ts";
import { getCalEnviroScreenTract } from "./get_calenviroscreen_tract.ts";
import { ces4RecordSchema, ces5RecordSchema } from "./schemas/mod.ts";

// Hand-built from camp/api/v2/ces/serializers.py, field for field: the local
// database had no CalEnviroScreen rows to capture (2026-11-04).
const validateCES4 = getSimpleValidationTest(ces4RecordSchema);
const validateCES5 = getSimpleValidationTest(ces5RecordSchema);

const params = (url: URL) => Object.fromEntries(url.searchParams);

Deno.test("CES fixtures match their own version's schema only", () => {
  validateCES4(ces4Fixture.data);
  validateCES5(ces5Fixture.data);
  assertEquals(ces5RecordSchema.safeParse(ces4Fixture.data[0]).success, false);
  assertEquals(ces4RecordSchema.safeParse(ces5Fixture.data[0]).success, false);
});

Deno.test("getCalEnviroScreen sends the version, region and within_mode", async () => {
  const stub = stubFetch(() => jsonResponse(ces5Fixture));
  try {
    const tracts = await getCalEnviroScreen("5.0", {
      region_id: "abc",
      within_mode: "contained",
    });
    assertEquals(tracts.length, 2);
    const { url } = stub.calls[0];
    assertEquals(url.pathname.endsWith("/calenviroscreen/5.0/"), true);
    assertEquals(params(url), { region_id: "abc", within_mode: "contained" });
  } finally {
    stub.restore();
  }
});

Deno.test("getCalEnviroScreen sends 4.0's year, and nothing without a query", async () => {
  const stub = stubFetch(() => jsonResponse(ces4Fixture));
  try {
    await getCalEnviroScreen("4.0", { year: "2010" });
    await getCalEnviroScreen("4.0");
    assertEquals(
      stub.calls[0].url.pathname.endsWith("/calenviroscreen/4.0/"),
      true,
    );
    assertEquals(params(stub.calls[0].url), { year: "2010" });
    assertEquals(params(stub.calls[1].url), {});
  } finally {
    stub.restore();
  }
});

Deno.test("getCalEnviroScreen fetches every page", async () => {
  const stub = stubFetch((url) => {
    const page = Number(url.searchParams.get("page") ?? 1);
    return jsonResponse({
      ...ces5Fixture,
      data: [ces5Fixture.data[page - 1]],
      page,
      pages: 2,
      has_next_page: page < 2,
    });
  });
  try {
    const tracts = await getCalEnviroScreen("5.0", { region_id: "abc" });
    assertEquals(tracts.map((t) => t.id), ["ces5rec1", "ces5rec2"]);
    assertEquals(stub.calls[1].url.searchParams.get("region_id"), "abc");
  } finally {
    stub.restore();
  }
});

Deno.test("getCalEnviroScreenTract fetches one tract, with 4.0's year", async () => {
  const stub = stubFetch(() => jsonResponse({ data: ces4Fixture.data[0] }));
  try {
    const tract = await getCalEnviroScreenTract("4.0", "06019000101", {
      year: "2010",
    });
    assertEquals(tract.tract, "06019000101");
    const { url } = stub.calls[0];
    assertEquals(
      url.pathname.endsWith("/calenviroscreen/4.0/06019000101/"),
      true,
    );
    assertEquals(params(url), { year: "2010" });
  } finally {
    stub.restore();
  }
});

Deno.test("CES query types follow the version", () => {
  // Type-level only: never called.
  const _check = async () => {
    // @ts-expect-error: 5.0 has no year
    await getCalEnviroScreen("5.0", { year: "2020" });
    // @ts-expect-error: 5.0 has no year
    await getCalEnviroScreenTract("5.0", "06019000101", { year: "2020" });
    const v5 = await getCalEnviroScreen("5.0");
    const _diabetes: number | null = v5[0].char_diabetes_p;
    const v4 = await getCalEnviroScreen("4.0");
    // @ts-expect-error: 4.0 has no diabetes indicator
    v4[0].char_diabetes_p;
  };
});

Deno.test({
  name: "Module: CalEnviroScreen (live)",
  permissions: { net: true, env: true },
  async fn(t) {
    if (!Deno.env.has("TEST_REMOTE")) setOrigin("http://127.0.0.1:8000");
    const skip = (version: string) =>
      console.warn(
        `No CalEnviroScreen ${version} rows on this server. Skipping validation.`,
      );
    await t.step("GET calenviroscreen/4.0/", async () => {
      const tracts = await getCalEnviroScreen("4.0");
      if (tracts.length === 0) return skip("4.0");
      validateCES4(tracts);
    });
    await t.step("GET calenviroscreen/5.0/", async () => {
      const tracts = await getCalEnviroScreen("5.0");
      if (tracts.length === 0) return skip("5.0");
      validateCES5(tracts);
    });
  },
});
