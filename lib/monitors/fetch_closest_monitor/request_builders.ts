import { getApiUrl } from "$http";
import type { MonitorDataField } from "../types.ts";

/**
 * Constructs the URL for getting the "monitors/closest" api endpoint.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An instance of URL configured for the "monitors/closest" api endpoint.
 */
export function getClosestMonitorUrl(
  entryType: MonitorDataField,
  latitude: number | string,
  longitude: number | string,
): URL {
  return getApiUrl(`monitors/${entryType}/closest`, {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });
}
