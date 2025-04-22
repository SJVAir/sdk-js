import { apiRequest, getApiV1Url } from "../../http/mod.ts";
import { validateClosestMonitor } from "./validate_closest_monitor.ts";
import type { MonitorData } from "../../types.ts";

/**
 * Constructs the URL for getting the "monitors/closest" api endpoint.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An instance of URL configured for the "monitors/closest" api endpoint.
 */
export function getClosestMonitorUrl(latitude: number, longitude: number): URL {
  return getApiV1Url("monitors/closest", {
    latitude: latitude.toString(),
    longitude: longitude.toString(),
  });
}

/**
 * Validates the data returned from the "monitors/closest" API endpoint.
 *
 * @param monitors An array containing monitor data.
 *
 * @returns The closest monitor that passed validation
 */
export function validateClosestMonitorResponse(
  monitors: Array<MonitorData>,
): MonitorData {
  if (!monitors.length) {
    throw new Error("Failed to get list of closest validatedMonitors");
  }

  const validatedMonitors: Array<MonitorData> = monitors.filter(
    validateClosestMonitor,
  );

  if (!validatedMonitors.length) {
    throw new Error("All validatedMonitors failed validation");
  }

  const monitor = validatedMonitors.shift()!;
  if (monitor.latest) {
    if ("pm25" in monitor.latest && parseInt(monitor.latest.pm25, 10) < 0) {
      monitor.latest.pm25 = "0";
    }

    if (
      "pm25_avg_60" in monitor.latest &&
      parseInt(monitor.latest.pm25_avg_60!, 10) < 0
    ) {
      monitor.latest.pm25_avg_60 = "0";
    }
  }

  return monitor;
}

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function fetchClosestMonitor(
  latitude: number,
  longitude: number,
): Promise<MonitorData> {
  const requestUrl = getClosestMonitorUrl(latitude, longitude);

  return await apiRequest<{ data: Array<MonitorData> }>(requestUrl)
    .then((res) => {
      const { data } = res.body;
      return validateClosestMonitorResponse(data);
    });
}
