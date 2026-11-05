import { assertEquals } from "@std/assert";
import regionsMetaFixture from "./fixtures/regions_meta.json" with {
  type: "json",
};
import { RegionsMeta } from "./get_regions_meta.ts";
import { regionDisplayName } from "./region_display_name.ts";
import type { RegionsMetaData } from "./types.ts";

// Captured from the server; JSON imports widen string literals.
const meta = regionsMetaFixture.data as unknown as RegionsMetaData;

Deno.test("regionDisplayName fills a type's template", () => {
  assertEquals(
    regionDisplayName({ type: "zipcode", name: "93702" }, meta),
    "ZIP 93702",
  );
  assertEquals(
    regionDisplayName({ type: "ab617", name: "Arvin, Lamont" }, meta),
    "Arvin, Lamont AB 617 Community",
  );
});

Deno.test("regionDisplayName shows the name when the template is null", () => {
  assertEquals(
    regionDisplayName({ type: "city", name: "Arvin" }, meta),
    "Arvin",
  );
});

Deno.test("regionDisplayName shows the name for a type missing from meta", () => {
  const empty = { types: {} } as unknown as Pick<RegionsMetaData, "types">;
  assertEquals(
    regionDisplayName({ type: "zipcode", name: "93702" }, empty),
    "93702",
  );
});

Deno.test("regionDisplayName keeps $ patterns in a name literal", () => {
  assertEquals(
    regionDisplayName({ type: "urban_area", name: "A $& $1 $$ B" }, meta),
    "A $& $1 $$ B Urban Area",
  );
});

Deno.test("regionDisplayName doesn't expand {name} inside a name", () => {
  assertEquals(
    regionDisplayName({ type: "zipcode", name: "{name}" }, meta),
    "ZIP {name}",
  );
});

Deno.test("regionDisplayName accepts a RegionsMeta instance", () => {
  assertEquals(
    regionDisplayName(
      { type: "tract", name: "06019000100" },
      new RegionsMeta(meta),
    ),
    "Census Tract 06019000100",
  );
});
