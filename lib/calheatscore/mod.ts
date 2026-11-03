/**
 * A collection of utilities for interacting with the SJVAir /calheatscore/ endpoints.
 *
 * @example Usage
 * ```ts
 * import { getCalHeatScoreMeta } from "@sjvair/sdk/calheatscore";
 *
 * const { scales } = await getCalHeatScoreMeta();
 * console.log(scales["heat-score"].label);
 * // Prints: Heat Score
 * ```
 *
 * @module
 */
export * from "./get_calheatscore_meta.ts";
export * from "./types.ts";
