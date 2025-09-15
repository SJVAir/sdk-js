import { apiCall, jsonCall, paginatedApiCall } from "$http";
import type {
  MonitorSubscription,
  MonitorUnsubscribeResponse,
} from "./types.ts";

/**
 * Get all subscriptions of a user.
 *
 * @returns An array of MonitorSubscription objects
 */
export async function getSubscriptions(
  apiToken: string,
): Promise<Array<MonitorSubscription>> {
  return await paginatedApiCall<MonitorSubscription>({
    url: "alerts/subscriptions",
    init: {
      headers: {
        "Accept": "application/json",
        "Authorization": `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
    },
  });
}

export interface MonitorSubscriptionConfig {
  monitorId: string;
  apiToken: string;
  level: MonitorSubscription["level"];
}
/**
 * Get all subscriptions of a user.
 *
 * @returns An array of MonitorSubscription objects
 */
export async function subscribe(
  config: MonitorSubscriptionConfig,
): Promise<MonitorSubscription> {
  const { monitorId, apiToken, level } = config;
  return await jsonCall<MonitorSubscription>({
    url: `monitors/${monitorId}/alerts/subscribe`,
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ level }),
    },
  });
}

/**
 * Get all subscriptions of a user.
 *
 * @returns An array of MonitorSubscription objects
 */
export async function unsubscribe(
  config: MonitorSubscriptionConfig,
): Promise<MonitorUnsubscribeResponse> {
  const { monitorId, apiToken, level } = config;
  return await apiCall<MonitorUnsubscribeResponse>({
    url: `monitors/${monitorId}/alerts/unsubscribe`,
    init: {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Authorization": `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ level }),
    },
  });
}
