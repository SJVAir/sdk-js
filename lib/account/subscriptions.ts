import { apiCall, jsonCall, paginatedApiCall } from "$http";
import type {
  MonitorSubscription,
  MonitorUnsubscribeResponse,
} from "./types.ts";

function getSubscriptionHeaders(apiToken: string): HeadersInit {
  const headers: HeadersInit = {
    "Accept": "application/json",
    "Content-Type": "application/json",
  };

  if (!("USER" in globalThis)) {
    headers["Authorization"] = `Token ${apiToken}`;
  }
  return headers;
}

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
      headers: getSubscriptionHeaders(apiToken),
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
      headers: getSubscriptionHeaders(apiToken),
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
      headers: getSubscriptionHeaders(apiToken),
      body: JSON.stringify({ level }),
    },
  });
}
