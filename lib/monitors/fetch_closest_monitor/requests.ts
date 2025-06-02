import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import { fetchClosestMonitor } from "./fetchers.ts";
import { validateClosestMonitors } from "./validation.ts";
import type { DefaultClosestMonitor } from "./types.ts";
import { fetchClosestMonitorsHandler } from "./response_handlers.ts";

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function getClosestMonitor(
  latitude: number | string,
  longitude: number | string,
): Promise<DefaultClosestMonitor> {
  return await fetchClosestMonitor(
    DEFAULT_DISPLAY_FIELD,
    latitude,
    longitude,
  ).then(fetchClosestMonitorsHandler)
    .then(validateClosestMonitors);
}
