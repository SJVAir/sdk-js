import type { infer as zinfer } from "zod";
import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { hmsSmokeSchema } from "./schema.ts";

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
