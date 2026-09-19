import { assertEquals } from "@std/assert";
import { regionCategorySchema } from "./region_category.ts";

Deno.test("regionCategorySchema accepts all 7 backend categories", () => {
  const categories = [
    "administrative",
    "census",
    "district",
    "environmental",
    "synthetic",
    "agricultural",
    "custom",
  ];

  for (const category of categories) {
    regionCategorySchema.parse(category);
  }
});

Deno.test("regionCategorySchema rejects an unknown category", () => {
  const result = regionCategorySchema.safeParse("not-a-real-category");
  assertEquals(result.success, false);
});
