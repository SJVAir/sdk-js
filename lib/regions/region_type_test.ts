import { assertEquals } from "@std/assert";
import { regionTypeSchema } from "./schemas/region_type.ts";

Deno.test("regionTypeSchema has no place type (the server removed it)", () => {
  assertEquals(regionTypeSchema.safeParse("place").success, false);
  assertEquals(regionTypeSchema.options.includes("place" as never), false);
});

Deno.test("regionTypeSchema keeps the server's region types", () => {
  assertEquals(regionTypeSchema.options, [
    "county",
    "city",
    "zipcode",
    "tract",
    "cdp",
    "congressional_district",
    "state_assembly",
    "state_senate",
    "school_district",
    "air_district",
    "urban_area",
    "land_use",
    "protected",
    "ab617",
    "mtrs",
    "custom",
  ]);
});
