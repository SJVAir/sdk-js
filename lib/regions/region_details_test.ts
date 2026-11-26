import { jsonResponse, stubFetch } from "../http/fetch_stub_test_utils.ts";
import { assertEquals } from "@std/assert";
import { regionsMetaSchema } from "./schemas/mod.ts";
import regionDetailFixture from "./fixtures/region_detail.json" with {
  type: "json",
};
import regionsMetaFixture from "./fixtures/regions_meta.json" with {
  type: "json",
};
import { getRegionDetails } from "./get_region_details.ts";
import { RegionsMeta } from "./get_regions_meta.ts";
import type { RegionsMetaData } from "./types.ts";

Deno.test("getRegionDetails sends buffer", async () => {
  const stub = stubFetch(() => jsonResponse(regionDetailFixture));
  try {
    await getRegionDetails("r", { buffer: 3 });
    const { url } = stub.calls[0];
    assertEquals(url.pathname.endsWith("/regions/r/"), true);
    assertEquals(Object.fromEntries(url.searchParams), { buffer: "3" });
  } finally {
    stub.restore();
  }
});

Deno.test("getRegionDetails without a buffer sends no params", async () => {
  const stub = stubFetch(() => jsonResponse(regionDetailFixture));
  try {
    await getRegionDetails("r");
    await getRegionDetails("r", {});
    for (const { url } of stub.calls) {
      assertEquals(url.searchParams.has("buffer"), false);
    }
  } finally {
    stub.restore();
  }
});

Deno.test("regions meta requires buffers", () => {
  const meta = regionsMetaFixture.data;
  assertEquals(regionsMetaSchema.safeParse(meta).success, true);
  const { buffers: _buffers, ...withoutBuffers } = meta;
  assertEquals(regionsMetaSchema.safeParse(withoutBuffers).success, false);
});

Deno.test("RegionsMeta exposes buffers", () => {
  const meta = new RegionsMeta(
    regionsMetaFixture.data as unknown as RegionsMetaData,
  );
  assertEquals(meta.buffers.map((buffer) => buffer.miles), [0, 1, 3, 5]);
  assertEquals(meta.buffers[0].label, "Exact boundary");
});
