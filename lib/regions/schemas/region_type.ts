import * as z from "zod";

/** The type of geography a region represents */
export type RegionTypeSchema = z.ZodEnum<{
  county: "county";
  city: "city";
  zipcode: "zipcode";
  tract: "tract";
  cdp: "cdp";
  congressional_district: "congressional_district";
  state_assembly: "state_assembly";
  state_senate: "state_senate";
  school_district: "school_district";
  urban_area: "urban_area";
  land_use: "land_use";
  protected: "protected";
  place: "place";
  mtrs: "mtrs";
  custom: "custom";
}>;

export const regionTypeSchema: RegionTypeSchema = z.enum(
  [
    "county",
    "city",
    "zipcode",
    "tract",
    "cdp",
    "congressional_district",
    "state_assembly",
    "state_senate",
    "school_district",
    "urban_area",
    "land_use",
    "protected",
    "place",
    "mtrs",
    "custom",
  ] as const,
);
