/**
 * A utility function to retrieve all monitors from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getMonitorsList } from "@sjvair/sdk/monitors/get_monitors_list";
 *
 * const monitors = await getMonitorsList();
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
import { APIError, jsonCall, type RequestOptions } from "$http";
import type { MonitorData } from "./types.ts";

/**
 * Fetches all monitors, or the monitors of one dataset.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch
 * init, plus `dataset`. With `dataset: "weather"` the list holds CIMIS weather
 * stations; `"air-quality"` is the default list. See `places_url` in the
 * dataset catalog. An unknown dataset rejects with a 400.
 *
 * @returns An array of monitors. The default list rejects when empty; a
 * dataset list may be empty (an empty weather list is not an error).
 */
export async function getMonitorsList(
  options?: RequestOptions & { dataset?: string },
): Promise<Array<MonitorData>> {
  const { dataset, ...requestOptions } = options ?? {};
  return await jsonCall<Array<MonitorData>>(
    {
      url: "monitors",
      searchParams: dataset ? { dataset } : undefined,
      options: requestOptions,
    },
    (response) => {
      if (
        !Array.isArray(response.body.data) ||
        (!dataset && response.body.data.length <= 0)
      ) {
        throw new APIError("Failed to fetch all monitors", response);
      }
    },
  );
}
