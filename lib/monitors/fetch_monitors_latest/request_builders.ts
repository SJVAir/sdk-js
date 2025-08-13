import { getApiUrl } from "$http";
import type { MonitorEntryType } from "../types.ts";

/**
 * Constructs the URL for getting the "monitors" api endpoint.
 *
 * @returns An instance of URL configured for the "monitors" api endpoint.
 */
export function getMonitorsLatestUrl(
  field: MonitorEntryType,
): URL {
  return getApiUrl(`monitors/${field}/current`);
}
