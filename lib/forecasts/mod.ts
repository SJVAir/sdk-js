/**
 * A collection of utilities for interacting with the SJVAir /forecasts/ endpoints.
 *
 * @example Usage
 * ```ts
 * import { getForecastsMeta } from "@sjvair/sdk/forecasts";
 *
 * const { zones } = await getForecastsMeta();
 * console.log(zones.map((zone) => zone.name));
 * // Prints: [ "San Joaquin", "Stanislaus", "Merced", ... ]
 * ```
 *
 * @module
 */
export * from "./get_forecasts_meta.ts";
export * from "./types.ts";
