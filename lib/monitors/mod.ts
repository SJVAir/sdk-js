/**
 * A collection of utililties for interacting with the SJVAir API
 *
 * @example Usage
 * ```ts
 * import { getMonitorsLatest } from "@sjvair/sdk/monitors";
 *
 * const details = await getMonitorsLatest("pm25");
 * console.log(detals);
 * // Prints:
 * //  [
 * //    {
 * //       "id": "s7lfa-o-R--FTQHb22lmuQ",
 * //       "name": "UCM-aea0",
 * //       "type": "purpleair",
 * //       "device": "PA-II",
 * //       "is_active": true,
 * //       "is_sjvair": true,
 * //       "position": {
 * //          "type": "Point",
 * //          "coordinates": [
 * //             -121.367,
 * //             37.98531
 * //          ]
 * //       },
 * //       ... (excerpted for brevity)
 * //     },
 * //     {
 * //        "id": "KnHBj1JvQYiSiwQk62zFuA",
 * //        "name": "ucm-af3e",
 * //        "type": "purpleair",
 * //        "device": "PA-II",
 * //        "is_active": true,
 * //        "is_sjvair": true,
 * //        "position": {
 * //            "type": "Point",
 * //            "coordinates": [
 * //                -120.4623,
 * //                37.33503
 * //            ]
 * //        },
 * //        ... (excerpted for brevity)
 * //     }
 * //     ... (more monitors)
 * //   ]
 * ```
 *
 * @module
 */
export * from "./get_closest_monitor.ts";
export * from "./get_monitor_details.ts";
export * from "./get_monitor_entries.ts";
export * from "./get_monitor_entries_csv.ts";
export * from "./get_monitors.ts";
export * from "./get_monitors_latest.ts";
export * from "./get_monitors_meta.ts";
export * from "./types.ts";
