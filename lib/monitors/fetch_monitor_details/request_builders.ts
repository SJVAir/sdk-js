import { getApiUrl } from "$http";

/**
 * Constructs the URL for getting the "monitors/${monitorID}/entries" api endpoint.
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An instance of URL configured for the "monitors/${monitorID}/entries" api endpoint.
 */
export function getMonitorDetailsUrl(monitorId: string): URL {
  return getApiUrl(`monitors/${monitorId}`);
}
