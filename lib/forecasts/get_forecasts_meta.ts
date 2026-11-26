/**
 * A utility function for fetching the forecasts metadata from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getForecastsMeta } from "@sjvair/sdk/forecasts/get_forecasts_meta";
 *
 * const meta = await getForecastsMeta();
 * console.log(meta.zones.length);
 * // Prints: 9
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { ForecastsMeta } from "./types.ts";

/**
 * Fetches the scales forecasts are rated on and the zones the air district
 * forecasts for. A zone's `region` is null when it has no matching region.
 *
 * @example Usage
 * ```ts
 * import { getForecastsMeta } from "@sjvair/sdk/forecasts/get_forecasts_meta";
 *
 * const { scales, zones } = await getForecastsMeta();
 * console.log(scales["aqi-forecast"].levels.map((level) => level.label));
 * console.log(zones.map((zone) => zone.name));
 * ```
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The `scales` by id and the forecast `zones`.
 */
export async function getForecastsMeta(
  options?: RequestOptions,
): Promise<ForecastsMeta> {
  return await jsonCall<ForecastsMeta>({ url: "forecasts/meta", options });
}
