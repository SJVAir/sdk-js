/**
 * A utility function for fetching pesticide use for a region or monitor.
 *
 * @example Usage
 * ```ts
 * import { getPesticidesForPlace } from "@sjvair/sdk/pesticides/get_pesticides_for_place";
 *
 * const use = await getPesticidesForPlace(
 *   { region: { type: "county", external_id: "06019" } },
 *   { year__gte: 2022 },
 * );
 * console.log(use.years[0]);
 * // Prints: { year: 2022, pounds: 23490784.8, acres: 13379845.9, applications: 318894,
 * //   undated: { pounds: 0, acres: 0, applications: 0 } }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { type PlaceRef, placeSearchParams } from "../meta/place.ts";
import type { PesticidesForPlace, PesticidesForPlaceFilters } from "./types.ts";

/**
 * Fetches monthly and yearly pesticide use for a place.
 *
 * @param place A region by type and official code, or a monitor by id.
 * Land-use regions can't be looked up by code.
 * @param filters Narrow by chemical, commodity, category, IARC group,
 * application method, or a year range (1900 to 2100). Unset filters are not sent.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The place, use by month (only months with use) and use by year
 * (totals include records with no application date, shown in `undated`).
 */
export async function getPesticidesForPlace(
  place: PlaceRef,
  filters: PesticidesForPlaceFilters = {},
  options?: RequestOptions,
): Promise<PesticidesForPlace> {
  const searchParams = placeSearchParams(place);
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) searchParams[key] = String(value);
  }

  return await jsonCall<PesticidesForPlace>({
    url: "pesticides/place",
    searchParams,
    options,
  });
}
