/**
 * Types for the HMS fire endpoint
 * @module
 */
import type { infer as zinfer } from "zod";
import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { hmsFireSchema } from "./schema.ts";

export type HMSFireGeoJSON = zinfer<typeof hmsFireSchema>;

/**
 * The configuration options for the HMS fire endpoint
 */
export interface HMSFireRequestConfig {
  /** The results page number to fetch */
  page?: number;
}

/**
 * The data structure returned from the "/hms-fire/" endpoint
 */
export type FetchHMSFireResponse = APIRequestResponse<
  PaginatedResponse<HMSFireGeoJSON>
>;
