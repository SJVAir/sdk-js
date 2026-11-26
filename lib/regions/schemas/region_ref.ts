import * as z from "zod";
import { regionTypeSchema } from "./region_type.ts";

interface RegionRefSchema extends
  z.ZodObject<{
    /** The region's id */
    id: z.ZodString;
    /** The type of geography the region represents */
    type: typeof regionTypeSchema;
    /** The region's official code, unique within its type */
    external_id: z.ZodString;
    /** The region's name */
    name: z.ZodString;
  }> {}
/** A short reference to a region, such as a forecast zone's region */
export const regionRefSchema: RegionRefSchema = z.object({
  id: z.string(),
  type: regionTypeSchema,
  external_id: z.string(),
  name: z.string(),
});
