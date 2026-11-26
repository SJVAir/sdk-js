import { assertEquals } from "@std/assert";
import metaFixture from "../fixtures/regions_meta.json" with { type: "json" };
import { locationSourceSchema, locationTypeSchema } from "./location.ts";
import { regionsMetaSchema } from "./regions_meta.ts";
import type { LocationSource, LocationType } from "../types.ts";

Deno.test("an unknown location source parses unchanged", () => {
  assertEquals(locationSourceSchema.parse("cde-charter"), "cde-charter");
});

Deno.test("an unknown location type parses unchanged", () => {
  assertEquals(locationTypeSchema.parse("preschool"), "preschool");
});

Deno.test("known location values still parse", () => {
  for (const source of ["cde-public", "cde-private", "cdss-ccl"]) {
    assertEquals(locationSourceSchema.parse(source), source);
  }
  for (const type of ["public_school", "private_school", "child_care"]) {
    assertEquals(locationTypeSchema.parse(type), type);
  }
});

Deno.test("a non-string location source is rejected", () => {
  assertEquals(locationSourceSchema.safeParse(3).success, false);
  assertEquals(locationTypeSchema.safeParse(null).success, false);
});

Deno.test("location_types may omit a known type or add a new one", () => {
  const { child_care: _, ...known } = metaFixture.data.location_types;
  const without = { ...metaFixture.data, location_types: known };
  assertEquals(regionsMetaSchema.safeParse(without).success, true);

  const added = {
    ...metaFixture.data,
    location_types: {
      ...metaFixture.data.location_types,
      preschool: {
        type: "preschool",
        label: "Preschool",
        source: "cde-pre",
        group: "preschool",
      },
    },
  };
  assertEquals(regionsMetaSchema.safeParse(added).success, true);
});

Deno.test("location types accept known and unknown strings", () => {
  const known: LocationSource = "cde-public";
  const unknown: LocationSource = "anything";
  const type: LocationType = "preschool";
  assertEquals([known, unknown, type].length, 3);
});
