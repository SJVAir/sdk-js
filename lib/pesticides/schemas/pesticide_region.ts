import * as z from "zod";
import {
  type RegionTypeSchema,
  regionTypeSchema,
} from "../../regions/schemas/region_type.ts";

/**
 * A minimal Region reference, as embedded in pesticide records. Unlike
 * RegionSchema, this omits the boundary field.
 */
export interface PesticideRegionSchema extends
  z.ZodObject<{
    /** The ID of the region */
    id: z.ZodString;

    /** The name of the region */
    name: z.ZodString;

    /** The URL-safe slug of the region */
    slug: z.ZodString;

    /** The type of geography this region represents */
    type: RegionTypeSchema;
  }> {}

export const pesticideRegionSchema: PesticideRegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  type: regionTypeSchema,
});
