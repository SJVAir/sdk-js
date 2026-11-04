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
 * //        "bbox": [-120.919, 35.907, -118.361, 37.586]
 * //      }
 * //    },
 * //    ... (more regions)
 * //  ]
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { RegionListItem, RegionsWithinMode, RegionType } from "./types.ts";

/**
 * The filters available when listing regions. At least one of `name`, `slug`,
 * or `type` is required — the API has no pagination on this endpoint, and an
 * unfiltered request can return tens of thousands of regions (some with large
 * boundary geometries), producing a response hundreds of megabytes in size.
 *
 * `within` is an additional filter on top of whichever of `name`/`slug`/`type`
 * satisfies the requirement above — it restricts results to regions whose
 * boundary falls within one or more other regions, by region sqid.
 * `within_mode` chooses how: `"contained"` (the default) keeps regions wholly
 * inside, `"overlaps"` also keeps ones that straddle the edge, and flags each
 * with the other regions it is in (`also_in`).
 */
export type RegionsListFilters =
  | {
    name: string;
    slug?: string;
    type?: RegionType;
    within?: string | Array<string>;
    within_mode?: RegionsWithinMode;
  }
  | {
    name?: string;
    slug: string;
    type?: RegionType;
    within?: string | Array<string>;
    within_mode?: RegionsWithinMode;
  }
  | {
    name?: string;
    slug?: string;
    type: RegionType;
    within?: string | Array<string>;
    within_mode?: RegionsWithinMode;
  };

/**
 * Fetches all regions matching the given filters.
 *
 * @param filters An object containing the name, slug, and/or type filters. At
 * least one must be provided.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array containing all matching regions. Each boundary has a
 * `bbox` but no `geometry`; use `getRegionDetails` for a region's geometry.
 */
export async function getRegionsList(
  filters: RegionsListFilters,
  options?: RequestOptions,
): Promise<Array<RegionListItem>> {
  if (!filters.name && !filters.slug && !filters.type) {
    throw new Error(
      "getRegionsList requires at least one of the name, slug, or type filters",
    );
  }

  const searchParams: Record<string, string | Array<string>> = {};

  if (filters.name) {
    searchParams.name = filters.name;
  }

  if (filters.slug) {
    searchParams.slug = filters.slug;
  }

  if (filters.type) {
    searchParams.type = filters.type;
  }

  if (filters.within !== undefined) {
    searchParams.within = filters.within;
  }

  if (filters.within_mode !== undefined) {
    searchParams.within_mode = filters.within_mode;
  }

  return await jsonCall<Array<RegionListItem>>({
    url: "regions",
    searchParams,
    options,
  });
}
