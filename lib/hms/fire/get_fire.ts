/**
 * A utility function for fetching ongoing HMS Fire events from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHMSFire } from "@sjvair/sdk/hms/fire/get_fire";
 *
 * const ongoingFire = await getHMSFire();
 * console.log(ongoingFire);
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
import type { HMSFireGeoJSON } from "./types.ts";

/**
 * Fetch all pages of ongoing HMS Fire geojson, using native fetch api
 *
 * @returns An array of geojson objects
 */
export async function getHMSFire(): Promise<Array<HMSFireGeoJSON>> {
  return await paginatedApiCall<HMSFireGeoJSON>({ url: "hms/fire" });
}
