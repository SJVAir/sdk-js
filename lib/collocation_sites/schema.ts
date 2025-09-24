import * as z from "zod";
import { type GeoJSONPointSchema, geoJSONPointSchema } from "../schema.ts";

interface CollocationSchema extends
  z.ZodObject<{
    /** The ID of the collocation entry */
    id: z.ZodString;

    /** The ID of the reference monitor */
    reference_id: z.ZodString;

    /** The ID of the collocated monitor */
    colocated_id: z.ZodString;

    /** The name of the reference monitor */
    name: z.ZodString;

    /** The position of the reference monitor */
    position: GeoJSONPointSchema;
  }> {}

export const collocationSchema: CollocationSchema = z.object({
  /** The ID of the collocation entry */
  id: z.string(),

  /** The ID of the reference monitor */
  reference_id: z.string(),

  /** The ID of the collocated monitor */
  colocated_id: z.string(),

  /** The name of the reference monitor */
  name: z.string(),

  /** The position of the reference monitor */
  position: geoJSONPointSchema,
});
