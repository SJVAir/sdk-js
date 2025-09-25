/**
 * A utility function to retrieve all monitors from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getMonitors } from "@sjvair/sdk/monitors/get_monitors";
 *
 * const monitors = await getMonitors();
 * console.log(monitors);
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
import { APIError, jsonCall } from "$http";
import type { MonitorData } from "./types.ts";

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitors(): Promise<Array<MonitorData>> {
  return await jsonCall<Array<MonitorData>>(
    "monitors",
    (response) => {
      if (
        !Array.isArray(response.body.data) || response.body.data.length <= 0
      ) {
        throw new APIError("Failed to fetch all monitors", response);
      }
    },
  );
}
