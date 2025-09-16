import { paginatedApiCall } from "$http";
import type { HMSSmokeGeoJSON } from "./types.ts";

/**
 * Fetch all pages of HMS Smoke geojson, using native fetch api
 *
 * @returns An array of geojson objects
 */
export async function getHMSSmoke(): Promise<Array<HMSSmokeGeoJSON>> {
  return await paginatedApiCall<HMSSmokeGeoJSON>({ url: "hms-smoke" });
}
