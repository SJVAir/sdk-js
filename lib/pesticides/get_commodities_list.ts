/**
 * A utility function to retrieve pesticide commodities from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getCommoditiesList } from "@sjvair/sdk/pesticides/get_commodities_list";
 *
 * const commodities = await getCommoditiesList({ name: "almond" });
 * console.log(commodities);
 * // Prints:
 * //  [
 * //    { "id": "9xvrg", "site_code": "22007", "name": "ALMOND" },
 * //    ... (more commodities)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { CommodityData } from "./types.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing pesticide commodities */
export interface CommoditiesListFilters {
  /** The results page number to fetch */
  page?: number;

  /** Filter by the DPR site code, exact match */
  site_code?: string;

  /** Filter by commodity name, case-insensitive substring match */
  name?: string;
}

/**
 * Fetches all pesticide commodities matching the given filters.
 *
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching commodities.
 */
export async function getCommoditiesList(
  filters: CommoditiesListFilters = {},
): Promise<Array<CommodityData>> {
  return await paginatedApiCall<CommodityData>({
    url: "pesticides/commodities",
    searchParams: toSearchParams(filters),
  });
}
