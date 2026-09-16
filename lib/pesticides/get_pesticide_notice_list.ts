/**
 * A utility function to retrieve pesticide application notices from the
 * SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getPesticideNoticeList } from "@sjvair/sdk/pesticides/get_pesticide_notice_list";
 *
 * const notices = await getPesticideNoticeList({ upcoming: true, county: "tulare" });
 * console.log(notices);
 * // Prints:
 * //  [
 * //    {
 * //      "id": "n1a2b3",
 * //      "application_id": 123456,
 * //      "comtrs": "54M21S24E17",
 * //      "county": { "id": "dn3sk", "name": "Tulare County", "slug": "tulare", "type": "county" },
 * //      "point": { "type": "Point", "coordinates": [ -119.0, 36.2 ] },
 * //      "scheduled_application": "2026-01-05T08:00:00Z",
 * //      "treated_amount": 12.5,
 * //      "treated_units": "ACRES",
 * //      "application_method": "GROUND",
 * //      "chemicals": [ ... ],
 * //      "products": [ ... ]
 * //    },
 * //    ... (more notices)
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { PesticideNoticeData } from "./types.ts";
import { toSearchParams } from "./search_params.ts";

/** The filters available when listing pesticide application notices */
export interface PesticideNoticeListFilters {
  /** The results page number to fetch */
  page?: number;

  /** Filter by application method, exact match */
  application_method?: string;
  /** Filter by application method, case-insensitive exact match */
  application_method__iexact?: string;

  /** Filter by scheduled application time, exact match (ISO 8601) */
  scheduled_application?: string;
  /** Filter by scheduled application time, less than (ISO 8601) */
  scheduled_application__lt?: string;
  /** Filter by scheduled application time, less than or equal to (ISO 8601) */
  scheduled_application__lte?: string;
  /** Filter by scheduled application time, greater than (ISO 8601) */
  scheduled_application__gt?: string;
  /** Filter by scheduled application time, greater than or equal to (ISO 8601) */
  scheduled_application__gte?: string;

  /** Filter to notices within this distance (meters) of a WKT point */
  point__distance_lt?: string;
  /** Filter to notices beyond this distance (meters) of a WKT point */
  point__distance_gt?: string;
  /** Filter to notices contained by a WKT bounding box */
  point__bbcontains?: string;
  /** Filter to notices whose point overlaps a WKT bounding box */
  point__bboverlaps?: string;

  /** Filter by the county's slug */
  county?: string;

  /** Filter by the chemical's DPR chemical code */
  chemical?: number;

  /** Filter by the product's DPR product number */
  product?: number;

  /** Filter to notices scheduled at or after now */
  upcoming?: boolean;

  /** Filter to notices within the given region's boundary (county direct match, other types via MTRS spatial join) */
  region_id?: string;
}

/**
 * Fetches all pesticide application notices matching the given filters.
 *
 * @param filters An object containing the desired filters
 *
 * @returns An array containing all matching pesticide application notices.
 */
export async function getPesticideNoticeList(
  filters: PesticideNoticeListFilters = {},
): Promise<Array<PesticideNoticeData>> {
  return await paginatedApiCall<PesticideNoticeData>({
    url: "pesticides/notice",
    searchParams: toSearchParams(filters),
  });
}
