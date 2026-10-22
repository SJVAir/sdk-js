/**
 * A utility function to look school and child care locations up by their
 * official codes.
 *
 * @example Usage
 * ```ts
 * import { getLocationsByCode } from "@sjvair/sdk/regions/get_locations_by_code";
 *
 * const [site] = await getLocationsByCode("cdss-ccl", ["153400001"]);
 * console.log(site.name, site.regions.county?.external_id);
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { LOOKUP_MAX_CODES } from "./get_regions_by_code.ts";
import type { Location, LocationSource } from "./types.ts";

/**
 * Fetches the locations from one source that have the given codes. A code may
 * be a location's own `external_id` or one of its `aliases` (such as another
 * license number). Retired locations are returned too, flagged by `retired`.
 * Unknown codes are left out of the result.
 *
 * @param source Where the codes come from.
 * @param codes The codes to look up, at most 100. An empty list returns `[]`
 * without a request.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The matching locations, one each however many of their codes matched.
 */
export async function getLocationsByCode(
  source: LocationSource,
  codes: Array<string>,
  options?: RequestOptions,
): Promise<Array<Location>> {
  if (codes.length > LOOKUP_MAX_CODES) {
    throw new Error(
      `getLocationsByCode looks up at most ${LOOKUP_MAX_CODES} codes at once`,
    );
  }
  if (codes.length === 0) return [];

  return await jsonCall<Array<Location>>({
    url: "regions/locations",
    searchParams: { source, external_id: codes.join(",") },
    options,
  });
}
