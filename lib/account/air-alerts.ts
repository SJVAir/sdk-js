/**
 * A collection of utililties for interacting with the SJVAir /account/alerts/ endpoint.
 *
 * @example Usage
 * ```ts
 * import { getAirAlerts } from "@sjvair/sdk/account/air-alerts";
 *
 * const alerts = await getAirAlerts(<API_TOKEN>);
 *
 * console.log(alerts);
 * // Prints:
 * //  [
 * //    {
 * //      sqid: "u589e",
 * //      created: "2025-08-24T04:20:54.678Z",
 * //      modified: "2025-08-24T04:20:54.693Z",
 * //      monitor: "qesuIWgTQgqtfGJ0rvBBlw",
 * //      entry_type: "pm25",
 * //      start_time: "2025-08-24T04:20:54.678Z",
 * //      end_time: null,
 * //      level: "unhealthy"
 * //    },
 * //    {
 * //      sqid: "k2Rw7",
 * //      created: "2025-08-23T08:20:42.901Z",
 * //      modified: "2025-08-23T08:20:42.945Z",
 * //      monitor: "xgXCRh68SdG5FOdbUXvR6Q",
 * //      entry_type: "o3",
 * //      start_time: "2025-08-23T08:20:42.901Z",
 * //      end_time: null,
 * //      level: "unhealthy_sensitive"
 * //    }
 * //  ]
 * //
 * // `level` is a key into the levels for the alert's `entry_type` from
 * // `monitors/meta/` (null before the alert's first update).
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { AirAlert } from "./types.ts";

/**
 * Get all active alerts for a user's monitor subscriptions.
 *
 * @returns An array of alerts
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
