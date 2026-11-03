import * as z from "zod";
import { regionTypeSchema } from "../../regions/schemas/region_type.ts";

interface PlaceRegionSchema extends
  z.ZodObject<{
    /** The region, by its type, official code, and name */
    region: z.ZodObject<{
      type: typeof regionTypeSchema;
      external_id: z.ZodString;
      name: z.ZodString;
    }>;
  }> {}
/** A place asked about by a region */
export const placeRegionSchema: PlaceRegionSchema = z.object({
  region: z.object({
    type: regionTypeSchema,
    external_id: z.string(),
    name: z.string(),
  }),
});

interface PlaceMonitorSchema extends
  z.ZodObject<{
    /** The monitor's id */
    monitor: z.ZodString;
  }> {}
/** A place asked about by a monitor */
export const placeMonitorSchema: PlaceMonitorSchema = z.object({
  monitor: z.string(),
});

interface PlaceSchema
  extends z.ZodUnion<readonly [PlaceRegionSchema, PlaceMonitorSchema]> {}
/** The place a by-place answer is about, echoed back by the server */
export const placeSchema: PlaceSchema = z.union([
  placeRegionSchema,
  placeMonitorSchema,
]);
