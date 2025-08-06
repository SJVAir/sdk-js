import type { HMSSmokeGeoJSON } from "../types.ts";
import type { APIRequestResponse, PaginatedResponse } from "$http";

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
