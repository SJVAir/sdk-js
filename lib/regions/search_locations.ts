/**
 * A utility function to search school and child care locations by name.
 *
 * @example Usage
 * ```ts
 * import { searchLocations } from "@sjvair/sdk/regions/search_locations";
 *
 * const { results, more } = await searchLocations({
 *   q: "lincoln visalia",
 *   type: ["public_school", "child_care"],
 *   region: { type: "county", external_id: "06107" },
 * });
 * console.log(results.map((location) => location.name), more);
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import type {
  Location,
  LocationSearchResult,
  LocationType,
  RegionType,
} from "./types.ts";

/** The fewest characters (after trimming) a search needs before it is sent */
const MIN_QUERY_LENGTH = 2;

/** The parameters of a location search, plus the usual request options */
export type LocationSearchParams = {
  /** The name to search for; a town can be part of it ("lincoln visalia") */
  q: string;
  /** Limits the search to one location type, or several */
  type?: LocationType | Array<LocationType>;
  /** Limits the search to locations inside this region (by code) */
  region?: { type: RegionType; external_id: string };
} & RequestOptions;

/**
 * Searches schools and child care sites by name. The server tolerates typos
 * and answers a handful of rows; `more` says whether any match was left out.
 *
 * @param params The query and optional `type` and `region` filters, plus an
 * AbortSignal and extra fetch init.
 *
 * @returns The matching locations as `results`, and `more`. A query under 2
 * characters (after trimming) returns an empty result without a request.
 */
export async function searchLocations(
  params: LocationSearchParams,
): Promise<LocationSearchResult> {
  const { q: rawQuery, type, region, ...requestOptions } = params;
  const q = rawQuery.trim();
  if (q.length < MIN_QUERY_LENGTH) return { results: [], more: false };

  const searchParams: Record<string, string> = { q };
  const types = Array.isArray(type) ? type.join(",") : type;
  if (types) searchParams.type = types;
  if (region) {
    searchParams.region_type = region.type;
    searchParams.region = region.external_id;
  }

  const body = await apiCall<{ data: Array<Location>; more: boolean }>({
    url: "regions/locations/search",
    searchParams,
    options: requestOptions,
  });
  return { results: body.data, more: body.more };
}
