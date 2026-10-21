/**
 * A utility function for getting the details of a region.
 *
 * @example Usage
 * ```ts
 * import { getRegionDetails } from "@sjvair/sdk/regions/get_region_details";
 *
 * const details = await getRegionDetails("5nO2A8");
 * console.log(details);
 * // Prints:
 * //  {
 * //    "id": "5nO2A8",
 * //    "name": "Fresno County",
 * //    "slug": "fresno-county",
 * //    "type": "county",
 * //    "boundary": {
 * //      "id": "PBl0aV",
 * //      "version": "2020",
 * //      "geometry": { "type": "MultiPolygon", "coordinates": [ ... ] },
 * //      "bbox": [-120.919, 35.907, -118.361, 37.586]
 * //    }
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { RegionData } from "./types.ts";

/**
 * Fetch details about a region.
 *
 * @param regionId The ID of the requested region
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns A RegionData object containing region details
 */
export async function getRegionDetails(
  regionId: string,
  options?: RequestOptions,
): Promise<RegionData> {
  return await jsonCall<RegionData>({ url: `regions/${regionId}`, options });
}
