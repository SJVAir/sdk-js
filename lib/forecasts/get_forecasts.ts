/**
 * A utility function for fetching the air district's forecasts.
 *
 * @example Usage
 * ```ts
 * import { getForecasts } from "@sjvair/sdk/forecasts/get_forecasts";
 *
 * const forecasts = await getForecasts({ forecast_date: "2026-11-04" });
 * console.log(forecasts[0].zone_name, forecasts[0].aqi_category);
 * // Prints: Fresno Moderate
 * ```
 *
 * @module
 */
import { paginatedApiCall, type RequestOptions } from "$http";
import type { Forecast, ForecastFilters } from "./types.ts";

/**
 * Fetches all pages of forecasts, optionally narrowed to a zone's region and
 * to a date or date range.
 *
 * @param filters A `region_id`, and `forecast_date` or `gte` / `lte` bounds
 * (`YYYY-MM-DD`).
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of forecasts.
 */
export async function getForecasts(
  filters: ForecastFilters = {},
  options?: RequestOptions,
): Promise<Array<Forecast>> {
  const searchParams: Record<string, string> = {};
  if (filters.region_id !== undefined) {
    searchParams.region_id = filters.region_id;
  }
  if (filters.forecast_date !== undefined) {
    searchParams.forecast_date = filters.forecast_date;
  }
  if (filters.gte !== undefined) searchParams.forecast_date__gte = filters.gte;
  if (filters.lte !== undefined) searchParams.forecast_date__lte = filters.lte;

  return await paginatedApiCall<Forecast>({
    url: "forecasts",
    searchParams,
    options,
  });
}
