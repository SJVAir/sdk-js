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
