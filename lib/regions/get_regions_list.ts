/**
 * A utility function to retrieve all regions from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getRegionsList } from "@sjvair/sdk/regions/get_regions_list";
 *
 * const regions = await getRegionsList({ type: "county" });
 * console.log(regions);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "5nO2A8",
 * //      "name": "Fresno County",
 * //      "slug": "fresno-county",
 * //      "type": "county",
 * //      "boundary": {
 * //        "id": "PBl0aV",
 * //        "version": "2020",
 * //        "geometry": { "type": "MultiPolygon", "coordinates": [ ... ] },
 * //        "bbox": [-120.919, 35.907, -118.361, 37.586]
 * //      }
 * //    },
 * //    ... (more regions)
 * //  ]
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { RegionData, RegionType } from "./types.ts";

/**
 * The filters available when listing regions. At least one of `name`, `slug`,
 * or `type` is required — the API has no pagination on this endpoint, and an
 * unfiltered request can return tens of thousands of regions (some with large
 * boundary geometries), producing a response hundreds of megabytes in size.
 */
export type RegionsListFilters =
  | { name: string; slug?: string; type?: RegionType }
  | { name?: string; slug: string; type?: RegionType }
  | { name?: string; slug?: string; type: RegionType };

/**
 * Fetches all regions matching the given filters.
 *
 * @param filters An object containing the name, slug, and/or type filters. At
 * least one must be provided.
 *
 * @returns An array containing all matching regions.
 */
export async function getRegionsList(
  filters: RegionsListFilters,
): Promise<Array<RegionData>> {
  if (!filters.name && !filters.slug && !filters.type) {
    throw new Error(
      "getRegionsList requires at least one of the name, slug, or type filters",
    );
  }

  const searchParams: Record<string, string> = {};

  if (filters.name) {
    searchParams.name = filters.name;
  }

  if (filters.slug) {
    searchParams.slug = filters.slug;
  }

  if (filters.type) {
    searchParams.type = filters.type;
  }

  return await jsonCall<Array<RegionData>>({
    url: "regions",
    searchParams,
  });
}
