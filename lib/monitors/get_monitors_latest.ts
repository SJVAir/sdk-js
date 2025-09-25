/**
 * A utility function for fetching all monitors with a "latest" entry from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getMonitorsLatest } from "@sjvair/sdk/monitors/get_monitors_latest";
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
import { jsonCall } from "$http";
import type { MonitorEntryType, MonitorLatestType } from "./types.ts";

/**
 * Fetches all monitors with a "latest" entry.
 *
 * @returns An array containing all monitors with a "latest" entry.
 */
export async function getMonitorsLatest<
  T extends MonitorEntryType,
>(
  field: T,
): Promise<Array<MonitorLatestType<T>>> {
  return await jsonCall<Array<MonitorLatestType<T>>>(
    `monitors/${field}/current`,
  );
}
