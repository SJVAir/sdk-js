/**
 * A utility function for finding the weather stations for a region or monitor.
 *
 * @example Usage
 * ```ts
 * import { getWeatherStationsForPlace } from "@sjvair/sdk/monitors/get_weather_stations_for_place";
 *
 * const { stations } = await getWeatherStationsForPlace({
 *   region: { type: "county", external_id: "06019" },
 * });
 * console.log(stations[0].name, stations[0].inside, stations[0].distance);
 * // Prints: CIMIS #80 - Fresno State true 0
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import { type PlaceRef, placeSearchParams } from "../meta/place.ts";
import type { WeatherStationsForPlace } from "./types.ts";

/**
 * Fetches the weather stations for a place. The stations inside the place come
 * first, at distance 0. After them come up to 5 stations within 25 miles,
 * nearest first by distance from the place's edge, and always at least the
 * nearest one however far it is. A region with no boundary has none. For a
 * monitor, distance is measured from the monitor.
 *
 * @param place A region by type and official code, or a monitor by id.
 * Land-use regions can't be looked up by code.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The place, and its stations: each a monitor row plus `distance` (in
 * miles, to 0.1) and `inside`.
 */
export async function getWeatherStationsForPlace(
  place: PlaceRef,
  options?: RequestOptions,
): Promise<WeatherStationsForPlace> {
  return await jsonCall<WeatherStationsForPlace>({
    url: "monitors/weather/place",
    searchParams: placeSearchParams(place),
    options,
  });
}
