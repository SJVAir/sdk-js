/**
 * A utility function for fetching the smoke over a region or monitor by day.
 *
 * @example Usage
 * ```ts
 * import { getSmokeForPlace } from "@sjvair/sdk/hms/smoke/get_smoke_for_place";
 *
 * const smoke = await getSmokeForPlace(
 *   { region: { type: "county", external_id: "06019" } },
 *   { gte: "2026-10-26", lte: "2026-10-29" },
 * );
 * console.log(smoke.days[0]);
 * // Prints: {
 * //   date: "2026-10-26",
 * //   density: "heavy",
 * //   coverage: { light: 0.6885, medium: 0.0282, heavy: 0.0035 }
 * // }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { type PlaceRef, placeSearchParams } from "../../meta/place.ts";
import type { SmokeDates, SmokeForPlace } from "./types.ts";

/**
 * Fetches the smoke over a place: per date, the heaviest density and the
 * share of the place covered by each density.
 *
 * @param place A region by type and official code, or a monitor by id.
 * Land-use regions can't be looked up by code.
 * @param dates Narrow to `gte` / `lte` bounds (`YYYY-MM-DD`); both optional.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The place and its smoke by day. `density` is `null` on a day with
 * no smoke; a day with no smoke can't be told apart from a day whose smoke
 * data was never fetched.
 */
export async function getSmokeForPlace(
  place: PlaceRef,
  dates: SmokeDates = {},
  options?: RequestOptions,
): Promise<SmokeForPlace> {
  const searchParams = placeSearchParams(place);
  if (dates.gte !== undefined) searchParams.date__gte = dates.gte;
  if (dates.lte !== undefined) searchParams.date__lte = dates.lte;

  return await jsonCall<SmokeForPlace>({
    url: "hms/smoke/place",
    searchParams,
    options,
  });
}
