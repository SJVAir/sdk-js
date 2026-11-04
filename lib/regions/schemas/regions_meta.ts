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
    /** How many current regions of this type there are */
    count: z.ZodOptional<z.ZodNumber>;
    /** The region types this type nests inside, as `within` filters accept them */
    parents: z.ZodOptional<z.ZodArray<typeof regionTypeSchema>>;
    /** Whether regions of this type can be looked up by their official code */
    referenceable: z.ZodOptional<z.ZodBoolean>;
    /** Whether the type is meant to be browsed as a list or map layer */
    browsable: z.ZodOptional<z.ZodBoolean>;
  }> {}
export const regionTypeMetaSchema: RegionTypeMetaSchema = z.object({
  type: regionTypeSchema,
  label: z.string(),
  category: regionCategorySchema,
  count: z.number().optional(),
  parents: z.array(regionTypeSchema).optional(),
  referenceable: z.boolean().optional(),
  browsable: z.boolean().optional(),
});

interface RegionsMetaSchema extends
  z.ZodObject<{
    /** The types of regions used by SJVAir */
    types: z.ZodRecord<z.ZodString, RegionTypeMetaSchema>;
  }> {}
export const regionsMetaSchema: RegionsMetaSchema = z.object({
  types: z.record(z.string(), regionTypeMetaSchema),
});
