/**
 * CalEnviroScreen scores by census tract: the tracts in a region, or one
 * tract. Versions 4.0 and 5.0 have different fields, so every call names its
 * version; the SDK doesn't pick one. Indicator labels and units will come
 * from a future `calenviroscreen/meta/`.
 *
 * @example Usage
 * ```ts
 * import { getCalEnviroScreen } from "@sjvair/sdk/calenviroscreen";
 *
 * const tracts = await getCalEnviroScreen("5.0", {
 *   region_id: "5nO2A8",
 *   within_mode: "contained",
 * });
 * console.log(tracts.length);
 * ```
 *
 * @module
 */
export * from "./get_calenviroscreen.ts";
export * from "./get_calenviroscreen_tract.ts";
export * from "./types.ts";
