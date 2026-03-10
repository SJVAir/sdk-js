/**
 * A collection of utililties for interacting with the SJVAir /hms/ endpoints.
 *
 * @example Usage
 * ```ts
 * import { getHMSSmoke } from "@sjvair/sdk/hms/smoke";
 *
 * const ongoingSmoke = await getHMSSmoke();
 * console.log(ongoingSmoke);
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
export * from "./smoke/mod.ts";
export * from "./fire/mod.ts";
