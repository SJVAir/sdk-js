import { consolidatePaginatedRequest } from "$http";
import { fetchHMSSmoke } from "./fetchers.ts";
import type { HMSSmokeGeoJSON } from "../types.ts";
import type { HMSSmokeRequestConfig } from "../types.ts";

async function getHMSSmokePage(config?: HMSSmokeRequestConfig) {
  try {
    const result = await fetchHMSSmoke(config);
    return result.body;
  } catch (error) {
    throw new Error("Failed to fetch HMS Smoke page", { cause: error });
  }
}

/**
 * Fetch all pages of HMS Smoke geojson, using native fetch api
 *
 * @returns An array of geojson objects
 */
export async function getHMSSmoke(): Promise<Array<HMSSmokeGeoJSON>> {
  return await consolidatePaginatedRequest({ page: 1 }, getHMSSmokePage);
}
