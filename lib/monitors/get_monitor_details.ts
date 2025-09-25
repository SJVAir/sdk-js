/**
 * A utility function for getting the details of a monitor.
 *
 * @example Usage
 * ```ts
 * import { getMonitorDetails } from "@sjvair/sdk/monitors/get_monitor_details";
 *
 * const details = await getMonitorDetails("pm25", "37.7749", "-122.4194");
 * console.log(detals);
 * // Prints:
 * //  {
 * //    "id": "xgXCRh68SdG5FOdbUXvR6Q",
 * //    "name": "ucm-1ed",
 * //    "type": "purpleair",
 * //    "device": "PA-II",
 * //    "is_active": true,
 * //    "is_sjvair": true,
 * //    "position": {
 * //        "type": "Point",
 * //        "coordinates": [
 * //            -119.8551,
 * //            36.81932
 * //        ]
 * //    },
 * //    ... (excerpted for brevity)
 * //  }
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { MonitorDetails } from "./types.ts";

/**
 * The data structure returned from the "/monitors/{ MONITOR_ID }/" endpoint
 */
export type MonitorDetailsResponse = { data: MonitorDetails };

/**
 * Fetch details about a monitor
 *
 * @param monitorId The ID of the requested monitor
 *
 * @returns A MonitorData object containing monitor details
 */
export async function getMonitorDetails(
  monitorId: string,
): Promise<MonitorDetails> {
  return await jsonCall<MonitorDetails>(`monitors/${monitorId}`);
}
