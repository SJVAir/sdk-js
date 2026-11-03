/**
 * Types for the forecasts metadata.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  forecastForPlaceSchema,
  forecastSchema,
  forecastsMetaSchema,
  forecastZoneSchema,
} from "./schemas/mod.ts";

/** A zone the air district forecasts for */
export type ForecastZone = zinfer<typeof forecastZoneSchema>;

/** The metadata returned from forecasts/meta */
export type ForecastsMeta = zinfer<typeof forecastsMetaSchema>;

/** One zone's air quality forecast for a day */
export type Forecast = zinfer<typeof forecastSchema>;

/** The forecasts for a place, as returned from forecasts/place */
export type ForecastForPlace = zinfer<typeof forecastForPlaceSchema>;

/** Filters for the forecast list; dates are `YYYY-MM-DD` */
export type ForecastFilters = {
  /** A forecast zone's region id */
  region_id?: string;
  forecast_date?: string;
  /** On or after */
  gte?: string;
  /** On or before */
  lte?: string;
};

/** Dates to narrow a forecast answer to; all are `YYYY-MM-DD` */
export type ForecastDates = {
  date?: string;
  /** On or after */
  gte?: string;
  /** On or before */
  lte?: string;
};
