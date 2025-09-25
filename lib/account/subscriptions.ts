/**
 * A collection of utilities for managing a user's monitor subcriptions.
 *
 * @example Usage
 * ```ts
 * import { getSubscriptions, subscribe, unsubscribe } from "@sjvair/sdk/account/subscriptions";
 *
 * const subscription = subscribe({
 *   monitorId: "qesuIWgTQgqtfGJ0rvBBlw",
 *   apiToken,
 *   level: "unhealthy",
 * });
 *
 * console.log(subscription);
 * // Prints:
 * //  { monitor: "qesuIWgTQgqtfGJ0rvBBlw", level: "unhealthy" }
 *
 * const subscriptions = await getSubscriptions(apiToken);
 * console.log(subscriptions);
 * // Prints:
 * //  [
 * //    { monitor: "qesuIWgTQgqtfGJ0rvBBlw", level: "unhealthy" },
 * //  ]
 *
 * const unsubscribeResponse = await unsubscribe({
 *   monitorId: "qesuIWgTQgqtfGJ0rvBBlw",
 *   apiToken,
 *   level: "unhealthy",
 * });
 *
 * console.log(unsubscribeResponse);
 * // Prints:
 * //  { success: true }
 * ```
 *
 * @module
 */
import { apiCall, jsonCall, paginatedApiCall } from "$http";
import type {
  MonitorSubscription,
  MonitorUnsubscribeResponse,
} from "./types.ts";

/**
 * Generates the HTTP headers required for subscription management requests.
 *
 * If the global variable "USER" is not present, it adds an Authorization header
 * using the provided API token. Always sets "Accept" and "Content-Type" to "application/json".
 *
 * @param apiToken - The API token used for authentication.
 * @returns An object containing the necessary HTTP headers.
 */
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

/**
 * Configuration object for subscribing or unsubscribing to monitor alerts.
 */
export interface MonitorSubscriptionConfig {
  monitorId: string;
  apiToken: string;
  level: string;
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
