import * as z from "zod";

export const multiPolygonSchema = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(
    z.array(
      z.array(
        z.tuple([z.number(), z.number()]),
      ),
    ),
  ),
});

export const hmsSmokeSchema = z.object({
  id: z.string(),
  satellite: z.string(),
  density: z.enum(["light", "medium", "heavy"]),
  end: z.string(),
  start: z.string(),
  date: z.string(),
  geometry: multiPolygonSchema,
  is_final: z.boolean(),
});
