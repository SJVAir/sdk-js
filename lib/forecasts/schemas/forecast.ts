import * as z from "zod";
import { placeSchema } from "../../meta/schemas/mod.ts";
import { regionRefSchema } from "../../regions/schemas/mod.ts";

interface ForecastSchema extends
  z.ZodObject<{
    id: z.ZodString;
    /** The region the zone's forecast is published for */
    region: typeof regionRefSchema;
    zone_name: z.ZodString;
    /** The Pacific calendar date forecast, `YYYY-MM-DD` */
    forecast_date: z.ZodString;
    /** The date the forecast was issued, `YYYY-MM-DD` */
    issued_date: z.ZodString;
    /** When the forecast was published, an ISO timestamp */
    published_at: z.ZodString;
    aqi_value: z.ZodNumber;
    aqi_category: z.ZodString;
    pollutant: z.ZodString;
    /** The AQI category's color, a hex string */
    color: z.ZodString;
    burn_status: z.ZodString;
    burn_status_text: z.ZodString;
    air_alert: z.ZodBoolean;
    air_alert_start: z.ZodNullable<z.ZodString>;
    air_alert_end: z.ZodNullable<z.ZodString>;
  }> {}
/** One zone's air quality forecast for a day */
export const forecastSchema: ForecastSchema = z.object({
  id: z.string(),
  region: regionRefSchema,
  zone_name: z.string(),
  forecast_date: z.string(),
  issued_date: z.string(),
  published_at: z.string(),
  aqi_value: z.number(),
  aqi_category: z.string(),
  pollutant: z.string(),
  color: z.string(),
  burn_status: z.string(),
  burn_status_text: z.string(),
  air_alert: z.boolean(),
  air_alert_start: z.string().nullable(),
  air_alert_end: z.string().nullable(),
});

interface ForecastRuleSchema extends
  z.ZodEnum<{
    zone: "zone";
    county: "county";
    center: "center";
    overlap: "overlap";
  }> {}
/** How a place was matched to a forecast zone */
export const forecastRuleSchema: ForecastRuleSchema = z.enum([
  "zone",
  "county",
  "center",
  "overlap",
]);

interface ForecastForPlaceSchema extends
  z.ZodObject<{
    /** The place asked about */
    place: typeof placeSchema;
    /** The forecast zone the place falls in, if any */
    zone: z.ZodNullable<typeof regionRefSchema>;
    /** How the place was matched to the zone, if it was */
    rule: z.ZodNullable<ForecastRuleSchema>;
    /** The zone's forecasts, one per date */
    forecasts: z.ZodArray<ForecastSchema>;
  }> {}
/** The forecasts for a place, as returned from forecasts/place */
export const forecastForPlaceSchema: ForecastForPlaceSchema = z.object({
  place: placeSchema,
  zone: regionRefSchema.nullable(),
  rule: forecastRuleSchema.nullable(),
  forecasts: z.array(forecastSchema),
});
