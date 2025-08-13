import { fetchClosestMonitor } from "./fetchers.ts";
import { validateClosestMonitors } from "./validation.ts";
import { fetchClosestMonitorsHandler } from "./response_handlers.ts";
import type { MonitorClosestType, MonitorEntryType } from "../types.ts";

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param entryType The type of entry to include in the "latest" field
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function getClosestMonitor<T extends MonitorEntryType>(
  entry: T,
  latitude: number | string,
  longitude: number | string,
): Promise<MonitorClosestType<T>> {
  return await fetchClosestMonitor(
    entry,
    latitude,
    longitude,
  ).then(fetchClosestMonitorsHandler)
    .then(validateClosestMonitors);
}
