import * as z from "zod";
import { regionCategorySchema } from "./region_category.ts";
import { regionTypeSchema } from "./region_type.ts";

interface RegionTypeMetaSchema extends
  z.ZodObject<{
    /** The type of region this metadata describes */
    type: typeof regionTypeSchema;
    /** The type of this region in presentation form */
    label: z.ZodString;
    /** The backend classification this region type belongs to */
    category: typeof regionCategorySchema;
  }> {}
export const regionTypeMetaSchema: RegionTypeMetaSchema = z.object({
  type: regionTypeSchema,
  label: z.string(),
  category: regionCategorySchema,
});

interface RegionsMetaSchema extends
  z.ZodObject<{
    /** The types of regions used by SJVAir */
    types: z.ZodRecord<z.ZodString, RegionTypeMetaSchema>;
  }> {}
export const regionsMetaSchema: RegionsMetaSchema = z.object({
  types: z.record(z.string(), regionTypeMetaSchema),
});
