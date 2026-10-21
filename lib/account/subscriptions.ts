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
import type { RequestOptions } from "$http";
import { authHeaders } from "./auth_headers.ts";
import type {
  MonitorSubscription,
  MonitorUnsubscribeResponse,
} from "./types.ts";

/**
 * Get all subscriptions of a user.
 *
 * @param apiToken Optional. Without it, the call relies on the session
 *   cookie; a missing sign-in surfaces as the server's 401/403.
 * @param options Request options.
 * @returns An array of MonitorSubscription objects
 */
export async function getSubscriptions(
  apiToken?: string,
  options?: RequestOptions,
): Promise<Array<MonitorSubscription>> {
  return await paginatedApiCall<MonitorSubscription>({
    url: "alerts/subscriptions",
    init: {
      headers: authHeaders(apiToken, {
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
    },
    options,
  });
}

/**
 * Configuration object for subscribing or unsubscribing to monitor alerts.
 */
export interface MonitorSubscriptionConfig {
  monitorId: string;
  /**
   * Optional. Without it, the call relies on the session cookie; a missing
   * sign-in surfaces as the server's 401/403.
   */
  apiToken?: string;
  level: string;
}

/**
 * Subscribe to air alerts for a monitor at a given level.
 *
 * @param config The monitor, level, and optional API token. Without a token,
 * the call relies on the session cookie.
 * @param options Request options.
 *
 * @returns The created MonitorSubscription
 */
export async function subscribe(
  config: MonitorSubscriptionConfig,
  options?: RequestOptions,
): Promise<MonitorSubscription> {
  const { monitorId, apiToken, level } = config;

  return await jsonCall<MonitorSubscription>({
    url: `monitors/${monitorId}/alerts/subscribe`,
    init: {
      method: "POST",
      headers: authHeaders(apiToken, {
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ level }),
    },
    options,
  });
}

/**
 * Unsubscribe from air alerts for a monitor at a given level.
 *
 * @param config The monitor, level, and optional API token. Without a token,
 * the call relies on the session cookie.
 * @param options Request options.
 *
 * @returns The server's unsubscribe response
 */
export async function unsubscribe(
  config: MonitorSubscriptionConfig,
  options?: RequestOptions,
): Promise<MonitorUnsubscribeResponse> {
  const { monitorId, apiToken, level } = config;
  return await apiCall<MonitorUnsubscribeResponse>({
    url: `monitors/${monitorId}/alerts/unsubscribe`,
    init: {
      method: "POST",
      headers: authHeaders(apiToken, {
        Accept: "application/json",
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ level }),
    },
    options,
  });
}
