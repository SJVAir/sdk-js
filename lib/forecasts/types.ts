/**
 * Types for the forecasts metadata.
 * @module
 */
import type { infer as zinfer } from "zod";
import type { forecastsMetaSchema, forecastZoneSchema } from "./schemas/mod.ts";

/** A zone the air district forecasts for */
export type ForecastZone = zinfer<typeof forecastZoneSchema>;

/** The metadata returned from forecasts/meta */
export type ForecastsMeta = zinfer<typeof forecastsMetaSchema>;
