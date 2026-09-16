/**
 * A utility function to retrieve pesticide use records from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getPesticideUseList } from "@sjvair/sdk/pesticides/get_pesticide_use_list";
 *
 * const uses = await getPesticideUseList({ year: 2022, county: "tulare" });
 * console.log(uses);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "fucm98",
 * //      "year": 2022,
 * //      "use_no": 3858276,
 * //      "comtrs": "54M21S24E17",
 * //      "lbs_chemical": null,
 * //      "acres_treated": 85.0,
 * //      "application_date": "2022-12-31",
 * //      "aerial_ground": "A",
 * //      "county": { "id": "dn3sk", "name": "Tulare County", "slug": "tulare", "type": "county" },
 * //      "mtrs": null,
 * //      "product": { "id": "6ezxm", "prodno": 68339, ... },
 * //      "chemical": null,
 * //      "commodity": { "id": "9xvrg", "site_code": "22007", "name": "WHEAT (FORAGE - FODDER)" }
 * //    },
 * //    ... (more use records)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { AerialGround, PesticideUseData } from "./types.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing pesticide use records */
export interface PesticideUseListFilters {
  /** The results page number to fetch */
  page?: number;

  /** Filter by application year, exact match */
  year?: number;
  /** Filter by application year, less than */
  year__lt?: number;
  /** Filter by application year, less than or equal to */
  year__lte?: number;
  /** Filter by application year, greater than */
  year__gt?: number;
  /** Filter by application year, greater than or equal to */
  year__gte?: number;

  /** Filter by application method, exact match */
  aerial_ground?: AerialGround;

  /** Filter by application date, exact match (YYYY-MM-DD) */
  application_date?: string;
  /** Filter by application date, less than (YYYY-MM-DD) */
  application_date__lt?: string;
  /** Filter by application date, less than or equal to (YYYY-MM-DD) */
  application_date__lte?: string;
  /** Filter by application date, greater than (YYYY-MM-DD) */
  application_date__gt?: string;
  /** Filter by application date, greater than or equal to (YYYY-MM-DD) */
  application_date__gte?: string;

  /** Filter to records whose MTRS section boundary is within this distance (meters) of a WKT geometry */
  "mtrs__boundary__geometry__distance_lt"?: string;
  /** Filter to records whose MTRS section boundary is beyond this distance (meters) of a WKT geometry */
  "mtrs__boundary__geometry__distance_gt"?: string;
  /** Filter to records whose MTRS section boundary is contained by a WKT bounding box */
  "mtrs__boundary__geometry__bbcontains"?: string;
  /** Filter to records whose MTRS section boundary overlaps a WKT bounding box */
  "mtrs__boundary__geometry__bboverlaps"?: string;

  /** Filter by the county's slug */
  county?: string;

  /** Filter by the chemical's DPR chemical code */
  chemical?: number;

  /** Filter by the commodity's DPR site code */
  commodity?: string;

  /** Filter by the product's DPR product number */
  product?: number;

  /** Filter to records within the given region's boundary (county direct match, other types via MTRS spatial join) */
  region_id?: string;
}

/**
 * Fetches all pesticide use records matching the given filters.
 *
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching pesticide use records.
 */
export async function getPesticideUseList(
  filters: PesticideUseListFilters = {},
): Promise<Array<PesticideUseData>> {
  return await paginatedApiCall<PesticideUseData>({
    url: "pesticides/use",
    searchParams: toSearchParams(filters),
  });
}
