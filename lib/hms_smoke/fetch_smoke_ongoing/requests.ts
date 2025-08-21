import { consolidatePaginatedRequest } from "$http";
import { fetchHMSSmokeOngoing } from "./fetchers.ts";
import type { HMSSmokeGeoJSON } from "../types.ts";
import type { HMSSmokeRequestConfig } from "../types.ts";

async function getHMSSmokeOngoingPage(config?: HMSSmokeRequestConfig) {
  try {
    const result = await fetchHMSSmokeOngoing(config);
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
export async function getHMSSmokeOngoing(): Promise<Array<HMSSmokeGeoJSON>> {
  return await consolidatePaginatedRequest({ page: 1 }, getHMSSmokeOngoingPage);
}
