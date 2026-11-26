import * as z from "zod";
import { scaleSchema } from "../../meta/schemas/mod.ts";
import { regionRefSchema } from "../../regions/schemas/mod.ts";

interface ForecastZoneSchema extends
  z.ZodObject<{
    /** The name of the forecast zone */
    name: z.ZodString;
    /** The region the zone's forecasts are published for, if any */
    region: z.ZodNullable<typeof regionRefSchema>;
  }> {}
/** A zone the air district forecasts for */
export const forecastZoneSchema: ForecastZoneSchema = z.object({
  name: z.string(),
  region: regionRefSchema.nullable(),
});

interface ForecastsMetaSchema extends
  z.ZodObject<{
    /** The scales forecasts are rated on, by id */
    scales: z.ZodRecord<z.ZodString, typeof scaleSchema>;
    /** The zones the air district forecasts for */
    zones: z.ZodArray<ForecastZoneSchema>;
  }> {}
/** The metadata returned from forecasts/meta */
export const forecastsMetaSchema: ForecastsMetaSchema = z.object({
  scales: z.record(z.string(), scaleSchema),
  zones: z.array(forecastZoneSchema),
});
