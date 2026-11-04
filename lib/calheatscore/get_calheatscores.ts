/**
 * A utility function for fetching CalHeatScore values by ZIP code and date.
 *
 * @example Usage
 * ```ts
 * import { getCalHeatScores } from "@sjvair/sdk/calheatscore/get_calheatscores";
 *
 * const scores = await getCalHeatScores({ zipcode: ["93701", "93210"] });
 * console.log(scores[0]);
 * // Prints: { zipcode: "93210", date: "2026-11-03", score: 0, score_display: "Low" }
 * ```
 *
 * @module
 */
import { paginatedApiCall, type RequestOptions } from "$http";
import type { CalHeatScore, CalHeatScoreFilters } from "./types.ts";

/**
 * Fetches all pages of CalHeatScore values, optionally narrowed to a date and
 * to one or more ZIP codes.
 *
 * @param filters A `date` (`YYYY-MM-DD`) and a `zipcode` or array of them.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of heat scores, one per ZIP code and day.
 */
export async function getCalHeatScores(
  filters: CalHeatScoreFilters = {},
  options?: RequestOptions,
): Promise<Array<CalHeatScore>> {
  // An empty `zipcode__in` filter is ignored by the server and would return
  // every ZIP code, so an empty list means there is nothing to ask for.
  if (Array.isArray(filters.zipcode) && filters.zipcode.length === 0) return [];

  const searchParams: Record<string, string> = {};
  if (filters.date !== undefined) searchParams.date = filters.date;
  if (Array.isArray(filters.zipcode)) {
    searchParams.zipcode__in = filters.zipcode.join(",");
  } else if (filters.zipcode !== undefined) {
    searchParams.zipcode = filters.zipcode;
  }

  return await paginatedApiCall<CalHeatScore>({
    url: "calheatscore",
    searchParams,
    options,
  });
}
