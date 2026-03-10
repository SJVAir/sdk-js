/**
 * A utility function for fetching HMS Fire events by their ID from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHMSFireById } from "@sjvair/sdk/hms/fire/get_fire_by_id";
 *
 * const fire = await getHMSFireById("MZWcmY0fTI2h_YlwS9PfWQ");
 * console.log(fire);
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
import { jsonCall } from "$http";
import type { HMSFireGeoJSON } from "./types.ts";

/**
 * Fetch a HMS Fire event by it's ID
 *
 * @param id - The ID of the HMS Fire event
 * @returns A HMSFireGeoJSON object
 */
export async function getHMSFireById(id: string): Promise<HMSFireGeoJSON> {
  return await jsonCall<HMSFireGeoJSON>({ url: `hms/fire/${id}` });
}
