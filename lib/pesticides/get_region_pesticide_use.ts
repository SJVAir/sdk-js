/**
 * A utility function to retrieve pesticide use records for a region from the
 * SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getRegionPesticideUse } from "@sjvair/sdk/pesticides/get_region_pesticide_use";
 *
 * const uses = await getRegionPesticideUse("dn3sk", { year: 2022 });
 * console.log(uses);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "fucm98",
 * //      "year": 2022,
 * //      ... (excerpted for brevity)
 * //    },
 * //    ... (more use records)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { PesticideUseData } from "./types.ts";
import type { PesticideUseListFilters } from "./get_pesticide_use_list.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing a region's pesticide use records */
export type RegionPesticideUseFilters = Omit<
  PesticideUseListFilters,
  "region_id"
>;

/**
 * Fetch pesticide use records for a region. County regions are matched
 * directly; all other region types are matched via a spatial join against
 * MTRS sections.
 *
 * @param regionId The ID of the region to fetch use records for
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching pesticide use records.
 */
export async function getRegionPesticideUse(
  regionId: string,
  filters: RegionPesticideUseFilters = {},
): Promise<Array<PesticideUseData>> {
  return await paginatedApiCall<PesticideUseData>({
    url: `pesticides/region/${regionId}/use`,
    searchParams: toSearchParams(filters),
  });
}
