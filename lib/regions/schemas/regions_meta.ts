import * as z from "zod";
import {
  type LocationGroupKeySchema,
  locationGroupKeySchema,
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
    /** The type's plural label, in Title Case (e.g. "Counties") */
    label_plural: z.ZodString;
    /**
     * The pattern for showing a region of this type, with `{name}` standing for
     * the region's name; `null` shows the name as it is
     */
    name_template: z.ZodNullable<z.ZodString>;
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
  label_plural: z.string(),
  name_template: z.nullable(z.string()),
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
    /** The `location_groups` key this type is listed under */
    group: LocationGroupKeySchema;
  }> {}
export const locationTypeMetaSchema: LocationTypeMetaSchema = z.object({
  type: locationTypeSchema,
  label: z.string(),
  source: locationSourceSchema,
  group: locationGroupKeySchema,
});

interface LocationGroupSchema extends
  z.ZodObject<{
    /** The permanent key of this group */
    key: LocationGroupKeySchema;
    /** The group in presentation form, e.g. "Schools" */
    label: z.ZodString;
    /** Where this group sorts; lower first */
    order: z.ZodNumber;
  }> {}
/** A group that location types are listed under, such as "Schools" */
export const locationGroupSchema: LocationGroupSchema = z.object({
  key: locationGroupKeySchema,
  label: z.string(),
  order: z.number(),
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
    /** The groups location types are listed under, by key; sort by `order` */
    location_groups: z.ZodRecord<z.ZodString, LocationGroupSchema>;
    /** The distances every `?buffer=` parameter accepts */
    buffers: z.ZodArray<RegionBufferSchema>;
  }> {}
export const regionsMetaSchema: RegionsMetaSchema = z.object({
  types: z.record(z.string(), regionTypeMetaSchema),
  location_types: z.record(locationTypeSchema, locationTypeMetaSchema),
  location_groups: z.record(z.string(), locationGroupSchema),
  buffers: z.array(regionBufferSchema),
});
