/**
 * A collection of utililties for interacting with the SJVAir /calibrations/ endpoint.
 *
 * @example Usage
 * ```ts
 * import { getCollocationSites } from "@sjvair/sdk/collocation_sites";
 *
 * const collocationSites = await getCollocationSites();
 *
 * console.log(collocationSites);
 * // Prints:
 * //  [
 * //    {
 * //      id: "a1b2c3d4e5f6g7h8i9j0",
 * //      reference_id: "m1n2o3p4q5r6s7t8u9v0",
 * //      colocated_id: "z9y8x7w6v5u4t3s2r1q0",
 * //      name: "Downtown Collocation Site",
 * //      position: {
 * //        type: "Point",
 * //        coordinates: [-122.4194, 37.7749]
 * //      }
 * //    }
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { CollocationSite } from "./types.ts";

/**
 * Fetches all collocation sites.
 *
 * @returns An array containing all collocation sites.
 */
export async function getCollocationSites(): Promise<Array<CollocationSite>> {
  return await paginatedApiCall<CollocationSite>("calibrations");
}
