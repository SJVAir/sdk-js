/**
 * Types for the CalHeatScore metadata.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  calHeatScoreMetaSchema,
  calHeatScoreSchema,
  heatForPlaceSchema,
} from "./schemas/mod.ts";

/** The metadata returned from calheatscore/meta */
export type CalHeatScoreMeta = zinfer<typeof calHeatScoreMetaSchema>;

/** One ZIP code's heat score for a day */
export type CalHeatScore = zinfer<typeof calHeatScoreSchema>;

/** The heat scores for a place, as returned from calheatscore/place */
export type HeatForPlace = zinfer<typeof heatForPlaceSchema>;

/** Filters for the CalHeatScore list; array zipcodes match any of them */
export type CalHeatScoreFilters = {
  /** A Pacific date, `YYYY-MM-DD` */
  date?: string;
  zipcode?: string | Array<string>;
};

/** Dates to narrow a heat answer to; all are `YYYY-MM-DD` */
export type HeatDates = {
  date?: string;
  /** On or after */
  gte?: string;
  /** On or before */
  lte?: string;
};
