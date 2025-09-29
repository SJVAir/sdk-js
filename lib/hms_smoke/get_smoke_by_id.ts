/**
 * A utility function for fetching HMS Smoke events by their ID from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHMSSmokeById } from "@sjvair/sdk/hms_smoke/get_smoke_by_id";
 *
 * const smoke = await getHMSSmokeById("MZWcmY0fTI2h_YlwS9PfWQ");
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
import { jsonCall } from "$http";
import type { HMSSmokeGeoJSON } from "./types.ts";

/**
 * Fetch a HMS Smoke event by it's ID
 *
 * @param id - The ID of the HMS Smoke event
 * @returns A HMSSmokeGeoJSON object
 */
export async function getHMSSmokeById(id: string): Promise<HMSSmokeGeoJSON> {
  return await jsonCall<HMSSmokeGeoJSON>({ url: `hms-smoke/${id}` });
}
