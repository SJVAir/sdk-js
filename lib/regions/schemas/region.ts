import * as z from "zod";
import {
  type BoundaryListSchema,
  boundaryListSchema,
  type BoundarySchema,
  boundarySchema,
} from "./boundary.ts";
import { type RegionTypeSchema, regionTypeSchema } from "./region_type.ts";

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

    /** The region's current boundary */
    boundary: z.ZodNullable<BoundarySchema>;
  }> {}

export const regionSchema: RegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: regionTypeSchema,
  boundary: z.nullable(boundarySchema),
});

export interface RegionListItemSchema extends
  z.ZodObject<{
    id: z.ZodString;

    name: z.ZodString;

    slug: z.ZodString;

    type: RegionTypeSchema;

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
  boundary: z.nullable(boundaryListSchema),
});
