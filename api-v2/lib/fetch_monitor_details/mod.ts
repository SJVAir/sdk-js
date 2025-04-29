import { getApiUrl } from "../http/mod.ts";
import type { MonitorData } from "../types.ts";

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

/**
 * Fetch details about a monitor
 *
 * @param monitorId The ID of the requested monitor
 *
 * @returns A MonitorData object containing monitor details
 */
export async function fetchMonitorDetails(
  monitorId: string,
): Promise<MonitorData> {
  const url = getMonitorDetailsUrl(monitorId);
  return await fetch(url)
    .then((raw) => raw.json())
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to fetch monitor details", err);
      return {};
    });
}
