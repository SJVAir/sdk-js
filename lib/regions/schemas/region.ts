import * as z from "zod";
import {
  type BoundaryListSchema,
  boundaryListSchema,
  type BoundarySchema,
  boundarySchema,
} from "./boundary.ts";
import { type RegionTypeSchema, regionTypeSchema } from "./region_type.ts";

export interface RegionRetiredSchema extends
  z.ZodObject<{
    /** The date the region was retired */
    since: z.ZodString;

    /** The region that replaced this one, named by its code; null if none */
    replaced_by: z.ZodNullable<
      z.ZodObject<{
        type: RegionTypeSchema;
        external_id: z.ZodString;
      }>
    >;
  }> {}

/** The marker a retired region carries (a current region has `null`) */
export const retiredRegionSchema: RegionRetiredSchema = z.object({
  since: z.string(),
  replaced_by: z.nullable(z.object({
    type: regionTypeSchema,
    external_id: z.string(),
  })),
});

export interface RegionSchema extends
  z.ZodObject<{
    /** The ID of the region */
    id: z.ZodString;

    /** The name of the region */
    name: z.ZodString;

    /** The URL-safe slug of the region */
    slug: z.ZodString;

    /** The type of geography this region represents */
    type: RegionTypeSchema;

    /** The region's permanent official code (e.g. a county FIPS), if it has one */
    external_id: z.ZodNullable<z.ZodString>;

    /** Set when the region has been retired; its code still resolves */
    retired: z.ZodNullable<RegionRetiredSchema>;

    /** The region's current boundary */
    boundary: z.ZodNullable<BoundarySchema>;
  }> {}

export const regionSchema: RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: regionTypeSchema,
  external_id: z.nullable(z.string()),
  retired: z.nullable(retiredRegionSchema),
  boundary: z.nullable(boundarySchema),
});

export interface RegionListItemSchema extends
  z.ZodObject<{
    id: z.ZodString;

    name: z.ZodString;

    slug: z.ZodString;

    type: RegionTypeSchema;

    /** The region's permanent official code (e.g. a county FIPS), if it has one */
    external_id: z.ZodNullable<z.ZodString>;

    /** Set when the region has been retired; its code still resolves */
    retired: z.ZodNullable<RegionRetiredSchema>;

    /** The region's current boundary, without its geometry */
    boundary: z.ZodNullable<BoundaryListSchema>;
  }> {}

/**
 * A region as returned by the regions list. Its boundary has a `bbox` but no
 * `geometry`; fetch the region's details for the full geometry.
 */
export const regionListItemSchema: RegionListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: regionTypeSchema,
  external_id: z.nullable(z.string()),
  retired: z.nullable(retiredRegionSchema),
  boundary: z.nullable(boundaryListSchema),
});
