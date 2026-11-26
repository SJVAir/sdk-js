/**
 * A utility function for fetching the CalHeatScore metadata from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getCalHeatScoreMeta } from "@sjvair/sdk/calheatscore/get_calheatscore_meta";
 *
 * const { scales } = await getCalHeatScoreMeta();
 * console.log(scales["heat-score"].levels.map((level) => level.label));
 * // Prints: [ "Low", "Moderate", ... ]
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { CalHeatScoreMeta } from "./types.ts";

/**
 * Fetches the scales CalHeatScore values are rated on, keyed by scale id.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The `scales` by id; `heat-score` is the heat score's level scale.
 */
export async function getCalHeatScoreMeta(
  options?: RequestOptions,
): Promise<CalHeatScoreMeta> {
  return await jsonCall<CalHeatScoreMeta>({
    url: "calheatscore/meta",
    options,
  });
}
