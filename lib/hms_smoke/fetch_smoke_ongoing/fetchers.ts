import { apiRequest, type PaginatedResponse } from "$http";
import { getHMSSmokeOngoingUrl } from "./request_builders.ts";
import type { HMSSmokeGeoJSON } from "../types.ts";
import type { FetchHMSSmokeResponse, HMSSmokeRequestConfig } from "../types.ts";

/**
 * Fetches current HMS Smoke shapefile.
 *
 * @returns The raw "/hms-smoke/" endpoint response
 */
export async function fetchHMSSmokeOngoing(
  config?: HMSSmokeRequestConfig,
): Promise<FetchHMSSmokeResponse> {
  const requestUrl = getHMSSmokeOngoingUrl(config);

  return await apiRequest<PaginatedResponse<HMSSmokeGeoJSON>>(requestUrl);
}
