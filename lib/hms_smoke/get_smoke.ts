/**
 * A utility function for fetching HMS Smoke events from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHMSSmoke } from "@sjvair/sdk/hms_smoke/get_smoke_ongoing";
 *
 * const smoke = await getHMSSmoke();
 * console.log(smoke);
 * // Prints:
 * //  [
 * //    {
 * //      id: "MZWcmY0fTI2h_YlwS9PfWQ",
 * //      satellite: "GOES-WEST",
 * //      density: "heavy",
 * //      end: "2025-09-07T14:30:00Z",
 * //      start: "2025-09-07T12:00:00Z",
 * //      date: "2025-09-07",
 * //      geometry: { type: "MultiPolygon", coordinates: [ [ [Array] ] ] },
 * //      is_final: true
 * //    },
 * //    ...
 * //  ]
 * ```
 *
 * @module
 */
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
