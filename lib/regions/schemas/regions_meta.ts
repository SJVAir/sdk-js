import * as z from "zod";
import {
  type LocationSourceSchema,
  locationSourceSchema,
  type LocationTypeSchema,
  locationTypeSchema,
} from "./location.ts";
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
    count: z.ZodNumber;
    /** The region types this type nests inside, as `within` filters accept them */
    parents: z.ZodArray<typeof regionTypeSchema>;
    /** Whether regions of this type can be looked up by their official code */
    referenceable: z.ZodBoolean;
    /** Whether the type is meant to be browsed as a list or map layer */
    browsable: z.ZodBoolean;
  }> {}
export const regionTypeMetaSchema: RegionTypeMetaSchema = z.object({
  type: regionTypeSchema,
  label: z.string(),
  category: regionCategorySchema,
  count: z.number(),
  parents: z.array(regionTypeSchema),
  referenceable: z.boolean(),
  browsable: z.boolean(),
});

interface LocationTypeMetaSchema extends
  z.ZodObject<{
    /** The location type this metadata describes */
    type: LocationTypeSchema;
    /** The type in presentation form */
    label: z.ZodString;
    /** Where locations of this type get their codes */
    source: LocationSourceSchema;
  }> {}
export const locationTypeMetaSchema: LocationTypeMetaSchema = z.object({
  type: locationTypeSchema,
  label: z.string(),
  source: locationSourceSchema,
});

interface RegionBufferSchema extends
  z.ZodObject<{
    /** How far the boundary is widened, in miles (0 is the boundary itself) */
    miles: z.ZodNumber;
    /** The label to show for this choice, e.g. "+1 mile" */
    label: z.ZodString;
  }> {}
export const regionBufferSchema: RegionBufferSchema = z.object({
  miles: z.number(),
  label: z.string(),
});

interface RegionsMetaSchema extends
  z.ZodObject<{
    /** The types of regions used by SJVAir */
    types: z.ZodRecord<z.ZodString, RegionTypeMetaSchema>;
    /** The types of locations (schools, child care), keyed by type */
    location_types: z.ZodRecord<LocationTypeSchema, LocationTypeMetaSchema>;
    /** The distances every `?buffer=` parameter accepts */
    buffers: z.ZodArray<RegionBufferSchema>;
  }> {}
export const regionsMetaSchema: RegionsMetaSchema = z.object({
  types: z.record(z.string(), regionTypeMetaSchema),
  location_types: z.record(locationTypeSchema, locationTypeMetaSchema),
  buffers: z.array(regionBufferSchema),
});
