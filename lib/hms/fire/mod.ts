/**
 * A collection of utililties for interacting with the SJVAir /hms/fire/ endpoints.
 *
 * @example Usage
 * ```ts
 * import { getHMSFire } from "@sjvair/sdk/hms/fire";
 *
 * const ongoingFire = await getHMSFire();
 * console.log(ongoingFire);
 * // Prints:
 * //  [
 * //    {
 * //      id: "MZWcmY0fTI2h_YlwS9PfWQ",
 * //      satellite: "GOES-WEST",
 * //      density: "heavy",
 * //      end: "2025-09-07T14:30:00Z",
 * //      start: "2025-09-07T12:00:00Z",
 * //      date: "2025-09-07",
 * //      geometry: { type: "MultiPolygon", coordinates: [ [ [Array] ] ] },
 * //      is_final: true
 * //    },
 * //    ...
 * //  ]
 * ```
 *
 * @module
 */
export * from "./get_fire.ts";
export * from "./get_fire_by_id.ts";
export * from "./types.ts";
