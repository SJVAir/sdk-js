import { getApiUrl } from "$http";
import type { MonitorEntryType } from "../types.ts";

/**
 * Constructs the URL for getting the "monitors/closest" api endpoint.
 *
 * @param entryType The type of entry to include in the "latest" field
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An instance of URL configured for the "monitors/closest" api endpoint.
 */
export function getClosestMonitorUrl(
  entryType: MonitorEntryType,
  latitude: number | string,
  longitude: number | string,
): URL {
  return getApiUrl(`monitors/${entryType}/closest`, {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });
}
