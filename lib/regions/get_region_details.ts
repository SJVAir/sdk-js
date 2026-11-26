/**
 * A utility function for getting the details of a region.
 *
 * @example Usage
 * ```ts
 * import { getRegionDetails } from "@sjvair/sdk/regions/get_region_details";
 *
 * const details = await getRegionDetails("5nO2A8");
 *
 * // The boundary widened by 3 miles (the choices are in getRegionsMeta())
 * const widened = await getRegionDetails("5nO2A8", { buffer: 3 });
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
import type { RegionData, RegionDetailsQuery } from "./types.ts";

/**
 * Fetch details about a region.
 *
 * @param regionId The ID of the requested region
 * @param query Optional: `buffer` widens the boundary by that many miles (the
 * allowed values are in `getRegionsMeta()`'s `buffers`).
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns A RegionData object containing region details
 */
export async function getRegionDetails(
  regionId: string,
  query?: RegionDetailsQuery,
  options?: RequestOptions,
): Promise<RegionData> {
  const searchParams: Record<string, string> = {};
  if (query?.buffer !== undefined) searchParams.buffer = String(query.buffer);
  return await jsonCall<RegionData>({
    url: `regions/${regionId}`,
    searchParams,
    options,
  });
}
