/**
 * A utility function to retrieve regions as GeoJSON from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getRegionsGeoJSON } from "@sjvair/sdk/regions/get_regions_geojson";
 *
 * const counties = await getRegionsGeoJSON({
 *   type: "county",
 *   external_id: ["06019", "06107"],
 *   simplify: true,
 * });
 * console.log(counties.features.map((feature) => feature.properties.name));
 * // Prints: [ "Fresno County", "Tulare County" ]
 * ```
 *
 * @module
 */
import { apiCall, type RequestOptions } from "$http";
import { fetchChunked } from "./lookup.ts";
import type { RegionFeatureCollection, RegionType } from "./types.ts";
import type { RegionsWithinMode } from "./types.ts";

/** The filters for a regions GeoJSON request; `type` is required */
export interface RegionsGeoJSONQuery {
  /** The type of the regions */
  type: RegionType;
  /** One or more official codes; not available for land-use regions */
  external_id?: string | Array<string>;
  /** One or more region sqids to restrict results to */
  within?: string | Array<string>;
  /** How `within` matches: wholly inside (default) or touching at all */
  within_mode?: RegionsWithinMode;
  slug?: string;
  name?: string;
  /** Ask for generalized shapes; the server supports it for county, zipcode, and tract */
  simplify?: boolean;
}

/**
 * Fetches regions as a GeoJSON feature collection. Each feature's `id` is the
 * region's id and its `properties` carry the region's name, slug, type, code,
 * and retired marker.
 *
 * Any number of codes can be given: the API takes 100 per request, so longer
 * lists go out in concurrent batches (duplicates sent once) and come back as
 * one collection. To get every region of a type inside an area, pass `within`
 * instead of listing codes: that's one request, however many regions match.
 *
 * @param query The type of regions and any further filters.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns A GeoJSON feature collection with one feature per matching region.
 */
export async function getRegionsGeoJSON(
  query: RegionsGeoJSONQuery,
  options?: RequestOptions,
): Promise<RegionFeatureCollection> {
  if (query.type === "land_use" && query.external_id !== undefined) {
    throw new Error("Land-use regions can't be looked up by code");
  }

  const searchParams: Record<string, string | Array<string>> = {
    type: query.type,
  };
  if (query.within !== undefined) searchParams.within = query.within;
  if (query.within_mode !== undefined) {
    searchParams.within_mode = query.within_mode;
  }
  if (query.slug !== undefined) searchParams.slug = query.slug;
  if (query.name !== undefined) searchParams.name = query.name;
  if (query.simplify) searchParams.simplify = "1";

  // The GeoJSON isn't wrapped in the usual `{ data }` envelope.
  const request = (external_id?: string) =>
    apiCall<RegionFeatureCollection>({
      url: "regions/geojson",
      searchParams: external_id === undefined
        ? searchParams
        : { ...searchParams, external_id },
      options,
    });

  if (!Array.isArray(query.external_id)) {
    return await request(query.external_id);
  }

  // The API resolves at most 100 codes per request, so longer lists go out
  // in concurrent batches, merged in order.
  const pages = await fetchChunked(
    query.external_id,
    (chunk) => request(chunk.join(",")),
  );
  return {
    ...pages[0],
    type: "FeatureCollection",
    features: pages.flatMap((page) => page.features),
  };
}
