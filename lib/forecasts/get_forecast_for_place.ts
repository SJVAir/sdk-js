/**
 * A utility function for fetching the forecasts for a region or monitor.
 *
 * @example Usage
 * ```ts
 * import { getForecastForPlace } from "@sjvair/sdk/forecasts/get_forecast_for_place";
 *
 * const { zone, rule, forecasts } = await getForecastForPlace({
 *   region: { type: "county", external_id: "06019" },
 * });
 * console.log(zone?.name, rule, forecasts.length);
 * // Prints: Fresno County county 2
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { type PlaceRef, placeSearchParams } from "../meta/place.ts";
import type { ForecastDates, ForecastForPlace } from "./types.ts";

/**
 * Fetches the forecasts of the zone a place falls in.
 *
 * @param place A region by type and official code, or a monitor by id.
 * Land-use regions can't be looked up by code.
 * @param dates Narrow to one `date`, or to `gte` / `lte` bounds (`YYYY-MM-DD`).
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The place, the matching `zone` and the `rule` that matched it (both
 * null when no zone covers the place), and the zone's forecasts.
 */
export async function getForecastForPlace(
  place: PlaceRef,
  dates: ForecastDates = {},
  options?: RequestOptions,
): Promise<ForecastForPlace> {
  const searchParams = placeSearchParams(place);
  if (dates.date !== undefined) searchParams.forecast_date = dates.date;
  if (dates.gte !== undefined) searchParams.forecast_date__gte = dates.gte;
  if (dates.lte !== undefined) searchParams.forecast_date__lte = dates.lte;

  return await jsonCall<ForecastForPlace>({
    url: "forecasts/place",
    searchParams,
    options,
  });
}
