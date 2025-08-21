import { apiRequest, type PaginatedResponse } from "$http";
import { getHMSSmokeUrl } from "./request_builders.ts";
import type { HMSSmokeGeoJSON } from "../types.ts";
import type { FetchHMSSmokeResponse, HMSSmokeRequestConfig } from "../types.ts";

/**
 * Fetches current HMS Smoke shapefile.
 *
 * @returns The raw "/hms-smoke/" endpoint response
 */
export async function fetchHMSSmoke(
  config?: HMSSmokeRequestConfig,
): Promise<FetchHMSSmokeResponse> {
  const requestUrl = getHMSSmokeUrl(config);

  return await apiRequest<PaginatedResponse<HMSSmokeGeoJSON>>(requestUrl);
}
