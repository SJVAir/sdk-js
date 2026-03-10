import * as z from "zod";
import { multiPolygonSchema, type MultiPolygonSchema } from "../../schema.ts";

export interface HMSSmokeSchema extends z.ZodObject<{
  /** The unique identifier for the smoke event */
  id: z.ZodString;
  /** The satellite from which the smoke data was obtained */
  satellite: z.ZodString;
  /** The density of the smoke, which can be "light", "medium", or "heavy" */
  density: z.ZodEnum<{ light: "light"; medium: "medium"; heavy: "heavy" }>;
  /** The end time of the smoke event in ISO 8601 format */
  end: z.ZodString;
  /** The start time of the smoke event in ISO 8601 format */
  start: z.ZodString;
  /** The date of the smoke event in YYYY-MM-DD format */
  date: z.ZodString;
  /** The geographical representation of the smoke event as a MultiPolygon */
  geometry: MultiPolygonSchema;
}> {}

export const hmsSmokeSchema: HMSSmokeSchema = z.object({
  id: z.string(),
  satellite: z.string(),
  density: z.enum(["light", "medium", "heavy"]),
  end: z.string(),
  start: z.string(),
  date: z.string(),
  geometry: multiPolygonSchema,
});
