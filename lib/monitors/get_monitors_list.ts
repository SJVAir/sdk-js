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
 * Fetches all monitors, the monitors of one dataset, or the monitors in some
 * regions.
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch
 * init, plus:
 * - `dataset`: with `"weather"` the list holds CIMIS weather stations;
 *   `"air-quality"` is the default list. See `places_url` in the dataset
 *   catalog. An unknown dataset rejects with a 400.
 * - `region`: one region id, or several (the monitors in any of them). Empty
 *   ids are dropped. An unknown id rejects with a 404. Combines with `dataset`.
 *
 * @returns An array of monitors. The default list rejects when empty; a list
 * filtered by `dataset` or `region` may be empty.
 */
export async function getMonitorsList(
  options?: RequestOptions & { dataset?: string; region?: string | string[] },
): Promise<Array<MonitorData>> {
  const { dataset, region, ...requestOptions } = options ?? {};
  const regions = [region ?? []].flat().filter((id) => id !== "");
  const searchParams: Record<string, string | string[]> = {};
  if (dataset) searchParams.dataset = dataset;
  if (regions.length > 0) searchParams.region = regions;
  const filtered = Object.keys(searchParams).length > 0;
  return await jsonCall<Array<MonitorData>>(
    {
      url: "monitors",
      searchParams: filtered ? searchParams : undefined,
      options: requestOptions,
    },
    (response) => {
      if (
        !Array.isArray(response.body.data) ||
        (!filtered && response.body.data.length <= 0)
      ) {
        throw new APIError("Failed to fetch all monitors", response);
      }
    },
  );
}
