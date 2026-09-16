/**
 * A utility function to retrieve pesticide application notices for a region
 * from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getRegionPesticideNotices } from "@sjvair/sdk/pesticides/get_region_pesticide_notices";
 *
 * const notices = await getRegionPesticideNotices("dn3sk", { upcoming: true });
 * console.log(notices);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "n1a2b3",
 * //      "application_id": 123456,
 * //      ... (excerpted for brevity)
 * //    },
 * //    ... (more notices)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { PesticideNoticeData } from "./types.ts";
import type { PesticideNoticeListFilters } from "./get_pesticide_notice_list.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing a region's pesticide application notices */
export type RegionPesticideNoticeFilters = Omit<
  PesticideNoticeListFilters,
  "region_id"
>;

/**
 * Fetch pesticide application notices for a region. County regions are
 * matched directly; all other region types are matched via a spatial join
 * against MTRS sections.
 *
 * @param regionId The ID of the region to fetch notices for
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching pesticide application notices.
 */
export async function getRegionPesticideNotices(
  regionId: string,
  filters: RegionPesticideNoticeFilters = {},
): Promise<Array<PesticideNoticeData>> {
  return await paginatedApiCall<PesticideNoticeData>({
    url: `pesticides/region/${regionId}/notice`,
    searchParams: toSearchParams(filters),
  });
}
