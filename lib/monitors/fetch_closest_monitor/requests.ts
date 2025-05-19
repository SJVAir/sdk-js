import { apiRequest } from "$http";
import { getClosestMonitorUrl } from "./request_builders.ts";
import type { MonitorDataField } from "../types.ts";
import type {
  ClosestMonitorsResponse,
  FetchClosestMonitorsResponse,
} from "./types.ts";

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function fetchClosestMonitor<T extends MonitorDataField>(
  entryType: T,
  latitude: number | string,
  longitude: number | string,
): Promise<FetchClosestMonitorsResponse<T>> {
  const requestUrl = getClosestMonitorUrl(entryType, latitude, longitude);

  return await apiRequest<ClosestMonitorsResponse<T>>(
    requestUrl,
  );
}
