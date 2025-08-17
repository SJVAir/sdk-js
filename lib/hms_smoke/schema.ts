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
    id: z.ZodString;
    satellite: z.ZodString;
    density: z.ZodEnum<{ light: "light"; medium: "medium"; heavy: "heavy" }>;
    end: z.ZodString;
    start: z.ZodString;
    date: z.ZodString;
    geometry: MultiPolygonSchema;
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
