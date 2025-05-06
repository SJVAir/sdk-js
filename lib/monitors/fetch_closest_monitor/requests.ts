import { apiRequest } from "$http";
import { getClosestMonitorUrl } from "./request_builders.ts";
import type { MonitorData, MonitorDataField } from "../types.ts";

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function fetchClosestMonitor(
  entryType: MonitorDataField,
  latitude: number,
  longitude: number,
): Promise<MonitorData> {
  const requestUrl = getClosestMonitorUrl(entryType, latitude, longitude);

  return await apiRequest<{ data: Array<MonitorData> }>(requestUrl)
    .then((res) => {
      const { data } = res.body;
      return validateClosestMonitorResponse(data);
    });
}
