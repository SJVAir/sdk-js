import * as z from "zod";
import { type RegionTypeSchema, regionTypeSchema } from "./region_type.ts";

/** Where a location's code comes from */
export type LocationSourceSchema = z.ZodEnum<{
  "cde-public": "cde-public";
  "cde-private": "cde-private";
  "cdss-ccl": "cdss-ccl";
}>;

export const locationSourceSchema: LocationSourceSchema = z.enum(
  ["cde-public", "cde-private", "cdss-ccl"] as const,
);

interface LocationRegionRefSchema extends
  z.ZodObject<{
    type: RegionTypeSchema;
    external_id: z.ZodString;
  }> {}

const locationRegionRefSchema: LocationRegionRefSchema = z.object({
  type: regionTypeSchema,
  external_id: z.string(),
});

export interface LocationRetiredSchema extends
  z.ZodObject<{
    /** The date the location was retired */
    since: z.ZodString;

    /** The location that replaced this one, named by its code; null if none */
    replaced_by: z.ZodNullable<
      z.ZodObject<{
        source: LocationSourceSchema;
        external_id: z.ZodString;
      }>
    >;
  }> {}

/** The marker a retired location carries (a current location has `null`) */
export const retiredLocationSchema: LocationRetiredSchema = z.object({
  since: z.string(),
  replaced_by: z.nullable(z.object({
    source: locationSourceSchema,
    external_id: z.string(),
  })),
});

export interface LocationSchema extends
  z.ZodObject<{
    /** The ID of the location */
    id: z.ZodString;

    /** Where the location's code comes from */
    source: LocationSourceSchema;

    /** The location's permanent code within its source */
    external_id: z.ZodString;

    /** Other codes (e.g. license numbers) that also resolve to this location */
    aliases: z.ZodArray<z.ZodString>;

    /** The kind of location (e.g. "public_school", "child_care") */
    type: z.ZodString;

    name: z.ZodString;
    address: z.ZodString;
    city_name: z.ZodString;
    zip: z.ZodString;

    point: z.ZodObject<{ lat: z.ZodNumber; lng: z.ZodNumber }>;

    /** The regions containing the location, named by code; null if none */
    regions: z.ZodObject<{
      county: z.ZodNullable<LocationRegionRefSchema>;
      city: z.ZodNullable<LocationRegionRefSchema>;
      zipcode: z.ZodNullable<LocationRegionRefSchema>;
      school_district: z.ZodNullable<LocationRegionRefSchema>;
    }>;

    /** Set when the location has been retired; its code still resolves */
    retired: z.ZodNullable<LocationRetiredSchema>;
  }> {}

export const locationSchema: LocationSchema = z.object({
  id: z.string(),
  source: locationSourceSchema,
  external_id: z.string(),
  aliases: z.array(z.string()),
  type: z.string(),
  name: z.string(),
  address: z.string(),
  city_name: z.string(),
  zip: z.string(),
  point: z.object({ lat: z.number(), lng: z.number() }),
  regions: z.object({
    county: z.nullable(locationRegionRefSchema),
    city: z.nullable(locationRegionRefSchema),
    zipcode: z.nullable(locationRegionRefSchema),
    school_district: z.nullable(locationRegionRefSchema),
  }),
  retired: z.nullable(retiredLocationSchema),
});
