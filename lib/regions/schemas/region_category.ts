import * as z from "zod";

/** The backend classification a region's type belongs to */
export type RegionCategorySchema = z.ZodEnum<{
  administrative: "administrative";
  census: "census";
  district: "district";
  environmental: "environmental";
  synthetic: "synthetic";
  agricultural: "agricultural";
  custom: "custom";
}>;

export const regionCategorySchema: RegionCategorySchema = z.enum(
  [
    "administrative",
    "census",
    "district",
    "environmental",
    "synthetic",
    "agricultural",
    "custom",
  ] as const,
);
