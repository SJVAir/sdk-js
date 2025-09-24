/**
 * A collection of utililties for interacting with the SJVAir /account/alerts/ API
 *
 * @example Usage
 * ```ts
 * import { getAirAlerts } from "@sjvair/sdk/account/alerts";
 *
 * const alerts = await getAirAlerts(<API_TOKEN>);
 *
 * console.log(alerts);
 * // Prints:
 * //  [
 * //    {
 * //      created: "2025-08-24T04:20:54.678Z",
 * //      modified: "2025-08-24T04:20:54.693Z",
 * //      id: "bHbmLtLkRRKYfjekdifjfj",
 * //      monitor: "qesuIWgTQgqtfGJ0rvBBlw",
 * //      entry_type: "pm25",
 * //      start_time: "2025-08-24T04:20:54.678Z",
 * //      end_time: null,
 * //      latest: 228
 * //    },
 * //    {
 * //      created: "2025-08-23T08:20:42.901Z",
 * //      modified: "2025-08-23T08:20:42.945Z",
 * //      id: "tMKf6BpCTByS0dkdkdkdkdkdk",
 * //      monitor: "xgXCRh68SdG5FOdbUXvR6Q",
 * //      entry_type: "pm25",
 * //      start_time: "2025-08-23T08:20:42.901Z",
 * //      end_time: null,
 * //      latest: 129
 * //    }
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { AirAlert } from "./types.ts";

/**
 * Get all active alerts for a user's monitor subscriptions.
 *
 * @returns An arry of alerts
 */
export async function getAirAlerts(
  apiToken: string,
): Promise<Array<AirAlert>> {
  return await paginatedApiCall<AirAlert>({
    url: "account/alerts",
    init: {
      headers: {
        "Authorization": `Token ${apiToken}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    },
  });
}
