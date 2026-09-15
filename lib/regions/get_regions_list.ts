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
 * //        "geometry": { "type": "MultiPolygon", "coordinates": [ ... ] }
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
 * The filters available when listing regions
 */
export interface RegionsListFilters {
  /** Restrict results to regions whose name contains this value */
  name?: string;

  /** Restrict results to the region with this exact slug */
  slug?: string;

  /** Restrict results to regions of this type */
  type?: RegionType;
}

/**
 * Fetches all regions matching the given filters.
 *
 * @param filters An object containing the optional name, slug, and type filters
 *
 * @returns An array containing all matching regions.
 */
export async function getRegionsList(
  filters?: RegionsListFilters,
): Promise<Array<RegionData>> {
  const searchParams: Record<string, string> = {};

  if (filters?.name) {
    searchParams.name = filters.name;
  }

  if (filters?.slug) {
    searchParams.slug = filters.slug;
  }

  if (filters?.type) {
    searchParams.type = filters.type;
  }

  return await jsonCall<Array<RegionData>>({
    url: "regions",
    searchParams,
  });
}
