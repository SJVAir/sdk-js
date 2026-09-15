import * as z from "zod";
import { type BoundarySchema, boundarySchema } from "./boundary.ts";
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
