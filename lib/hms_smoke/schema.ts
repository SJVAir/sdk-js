import * as z from "zod";

export interface MultiPolygonSchema extends
  z.ZodObject<{
    type: z.ZodLiteral<"MultiPolygon">;
    coordinates: z.ZodArray<
      z.ZodArray<z.ZodArray<z.ZodTuple<[z.ZodNumber, z.ZodNumber]>>>
    >;
  }> {}

export const multiPolygonSchema: MultiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(
    z.array(
      z.array(
        z.tuple([z.number(), z.number()]),
      ),
    ),
  ),
});

export interface HMSSmokeSchema extends
  z.ZodObject<{
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
    /** A boolean indicating whether the smoke event data is final */
    is_final: z.ZodBoolean;
  }> {}

export const hmsSmokeSchema: HMSSmokeSchema = z.object({
  id: z.string(),
  satellite: z.string(),
  density: z.enum(["light", "medium", "heavy"]),
  end: z.string(),
  start: z.string(),
  date: z.string(),
  geometry: multiPolygonSchema,
  is_final: z.boolean(),
});
