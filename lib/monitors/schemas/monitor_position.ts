import * as z from "zod";

export type MonitorPositionSchema = z.ZodObject<{
  /** The point coordinates of a monitor */
  coordinates: z.ZodArray<z.ZodNumber>;

  /** The type of GeoJSON object returned */
  type: z.ZodString;
}>;

export const monitorPositionSchema: MonitorPositionSchema = z.object({
  coordinates: z.array(z.number()).length(2),
  type: z.string(),
});
