/**
 * Types for the HMS smoke endpoint
 * @module
 */
import type { infer as zinfer } from "zod";
import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { HMSBaseQuery } from "../query.ts";
import type {
  hmsSmokeSchema,
  smokeDaySchema,
  smokeForPlaceSchema,
} from "./schema.ts";

export type HMSSmokeGeoJSON = zinfer<typeof hmsSmokeSchema>;

/**
 * The configuration options for the HMS smoke endpoint
 */
export interface HMSSmokeRequestConfig {
  /** The results page number to fetch */
  page?: number;
}

/**
 * The data structure returned from the "/hms-smoke/" endpoint
 */
export type FetchHMSSmokeResponse = APIRequestResponse<
  PaginatedResponse<HMSSmokeGeoJSON>
>;

/** The filters for an HMS smoke list: a day or range, a region, and density */
export type HMSSmokeQuery = HMSBaseQuery & {
  /** Only plumes of this density; labels and colors are in `getHMSMeta` */
  density?: HMSSmokeGeoJSON["density"];
};

/** One day of smoke over a place */
export type SmokeDay = zinfer<typeof smokeDaySchema>;

/** The smoke over a place by day */
export type SmokeForPlace = zinfer<typeof smokeForPlaceSchema>;

/** Dates to narrow a smoke-for-place answer to; both are `YYYY-MM-DD` */
export type SmokeDates = {
  /** On or after */
  gte?: string;
  /** On or before */
  lte?: string;
};
