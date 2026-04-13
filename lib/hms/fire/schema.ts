import * as z from "zod";
import { geoJSONPointSchema, type GeoJSONPointSchema } from "../../schema.ts";

export interface HMSFireSchema extends z.ZodObject<{
  /** The unique identifier for the fire event */
  id: z.ZodString;
  /** The ecosystem value */
  ecosystem: z.ZodNumber;
  /** The FRP value */
  frp: z.ZodNullable<z.ZodNumber>;
  /** The method value */
  method: z.ZodString;
  /** The satellite from which the fire data was obtained */
  satellite: z.ZodString;
  /** The date of the fire event in YYYY-MM-DD format */
  date: z.ZodString;
  /** The timestamp of the entry */
  timestamp: z.ZodString;
  /** The geographical representation of the fire event as a MultiPolygon */
  geometry: GeoJSONPointSchema;
}> {}

export const hmsFireSchema: HMSFireSchema = z.object({
  id: z.string(),
  ecosystem: z.number(),
  frp: z.number().nullable(),
  method: z.string(),
  satellite: z.string(),
  date: z.string(),
  timestamp: z.string(),
  geometry: geoJSONPointSchema,
});
