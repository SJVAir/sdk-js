/**
 * A utility function to retrieve an aggregated pesticide use summary for a
 * region from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getRegionPesticideSummary } from "@sjvair/sdk/pesticides/get_region_pesticide_summary";
 *
 * const summary = await getRegionPesticideSummary("dn3sk", { year: 2022 });
 * console.log(summary);
 * // Prints:
 * //  {
 * //    "region": { "id": "dn3sk", "name": "Tulare County", "slug": "tulare", "type": "county" },
 * //    "data": [
 * //      {
 * //        "year": 2022,
 * //        "chemical": { "id": "bca8f", "chem_code": 2254, "name": "ABAMECTIN", ... },
 * //        "commodity": { "id": "6cxb7", "site_code": "10", "name": "STRUCTURAL PEST CONTROL" },
 * //        "total_lbs": 0.0275,
 * //        "total_acres": null,
 * //        "application_count": 167
 * //      },
 * //      ... (more rows)
 * //    ],
 * //    "count": 1
 * //  }
 * ```
 *
 * @module
 */
import { apiCall } from "$http";
import type {
  AerialGround,
  IARCGroup,
  PesticideSummaryResponseData,
} from "./types.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when fetching a region's pesticide use summary */
export interface RegionPesticideSummaryFilters {
  /** Filter by application year, exact match */
  year?: number;
  /** Filter by application year, less than or equal to */
  year__lte?: number;
  /** Filter by application year, greater than or equal to */
  year__gte?: number;

  /** Filter by application method, exact match */
  aerial_ground?: AerialGround;

  /** Filter by the chemical's DPR chemical code */
  chemical?: number;

  /** Filter by the commodity's DPR site code */
  commodity?: string;

  /** Filter by hazard category */
  category?: string;

  /** Filter by the chemical's IARC carcinogenicity classification group */
  iarc_group?: IARCGroup;
}

/**
 * Fetch an aggregated pesticide use summary for a region, grouped by
 * chemical, commodity, and year. County regions are matched directly; all
 * other region types are matched via a spatial join against MTRS sections.
 *
 * @param regionId The ID of the region to summarize
 * @param filters An object containing the desired filters
 *
 * @returns A PesticideSummaryResponseData object
 */
export async function getRegionPesticideSummary(
  regionId: string,
  filters: RegionPesticideSummaryFilters = {},
): Promise<PesticideSummaryResponseData> {
  return await apiCall<PesticideSummaryResponseData>({
    url: `pesticides/region/${regionId}/summary`,
    searchParams: toSearchParams(filters),
  });
}
