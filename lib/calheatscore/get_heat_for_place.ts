/**
 * A utility function for fetching the CalHeatScore for a region or monitor.
 *
 * @example Usage
 * ```ts
 * import { getHeatForPlace } from "@sjvair/sdk/calheatscore/get_heat_for_place";
 *
 * const heat = await getHeatForPlace({
 *   region: { type: "county", external_id: "06019" },
 * });
 * console.log(heat.zip_count, heat.days[0]);
 * // Prints: 58 { date: "2026-11-03", score: 0, score_display: "Low", zipcode: "93210" }
 * // (`zipcode` is the ZIP code with the highest score that day; ties go to the lowest)
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { type PlaceRef, placeSearchParams } from "../meta/place.ts";
import type { HeatDates, HeatForPlace } from "./types.ts";

/**
 * Fetches the heat scores for a place: per date, the highest score among the
 * ZIP codes the place covers, and the ZIP code that set it.
 *
 * @param place A region by type and official code, or a monitor by id.
 * Land-use regions can't be looked up by code. A region covers every ZIP code
 * with at least 1% of its area inside the region; a monitor covers the ZIP
 * code that contains it.
 * @param dates Narrow to one `date`, or to `gte` / `lte` bounds (`YYYY-MM-DD`).
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The place, how many ZIP codes it covers, and its score by day.
 */
export async function getHeatForPlace(
  place: PlaceRef,
  dates: HeatDates = {},
  options?: RequestOptions,
): Promise<HeatForPlace> {
  const searchParams = placeSearchParams(place);
  if (dates.date !== undefined) searchParams.date = dates.date;
  if (dates.gte !== undefined) searchParams.date__gte = dates.gte;
  if (dates.lte !== undefined) searchParams.date__lte = dates.lte;

  return await jsonCall<HeatForPlace>({
    url: "calheatscore/place",
    searchParams,
    options,
  });
}
