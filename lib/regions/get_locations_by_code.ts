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
import { fetchChunked } from "./lookup.ts";
import type { Location, LocationSource } from "./types.ts";

/**
 * Fetches the locations from one source that have the given codes. A code may
 * be a location's own `external_id` or one of its `aliases` (such as another
 * license number). Retired locations are returned too, flagged by `retired`.
 * Unknown codes are left out of the result.
 *
 * @param source Where the codes come from.
 * @param codes The codes to look up, any number (the API takes 100 per
 * request, so longer lists go out in concurrent batches; duplicates are sent
 * once). An empty list returns `[]`
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
  if (codes.length === 0) return [];

  const wanted = new Set(codes.map((code) => code.trim()));
  // The API resolves at most 100 codes per request, so longer lists go out
  // in concurrent batches.
  const locations =
    (await fetchChunked(codes, (chunk) =>
      jsonCall<Array<Location>>({
        url: "regions/locations",
        searchParams: { source, external_id: chunk.join(",") },
        options,
      }))).flat();

  // Keep only the locations asked for, by `external_id` or any alias, in case
  // a server ignores the code filter. A location whose codes fell in
  // different batches comes back once per batch, so keep the first.
  const seen = new Set<string>();
  return locations.filter((location) => {
    if (seen.has(location.id)) return false;
    seen.add(location.id);
    return wanted.has(location.external_id) ||
      location.aliases.some((alias) => wanted.has(alias));
  });
}
