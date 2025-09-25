/**
 * A collection of utililties for interacting with the SJVAir /monitors/closest endpoint.
 *
 * @example Usage
 * ```ts
 * import { getClosestMonitor, getClosestMonitors } from "@sjvair/sdk/monitors/get_closest_monitor";
 *
 * const closestMonitors = await getClosestMonitors("pm25", "37.7749", "-122.4194");
 * console.log(closestMonitors);
 * // Prints:
 * // (example output)
 * //  [
 * //    {
 * //       "id": "s7lfa-o-R--FTQHb22lmuQ",
 * //       "name": "UCM-aea0",
 * //       "type": "purpleair",
 * //       "device": "PA-II",
 * //       "is_active": true,
 * //       "is_sjvair": true,
 * //       "distance": 12.34,
 * //       "position": {
 * //          "type": "Point",
 * //          "coordinates": [
 * //             -121.367,
 * //             37.98531
 * //          ]
 * //       },
 * //       ... (excerpted for brevity)
 * //     },
 * //     {
 * //        "id": "KnHBj1JvQYiSiwQk62zFuA",
 * //        "name": "ucm-af3e",
 * //        "type": "purpleair",
 * //        "device": "PA-II",
 * //        "is_active": true,
 * //        "is_sjvair": true,
 * //        "distance": 21.34,
 * //        "position": {
 * //            "type": "Point",
 * //            "coordinates": [
 * //                -120.4623,
 * //                37.33503
 * //            ]
 * //        },
 * //        ... (excerpted for brevity)
 * //     },
 * //     {
 * //        "id": "Kdwobe23xz0234hdjW3b6Q",
 * //        "name": "ucm-1ed",
 * //        "type": "purpleair",
 * //        "device": "PA-II",
 * //        "is_active": true,
 * //        "is_sjvair": true,
 * //        "distance": 21.34,
 * //        "position": {
 * //            "type": "Point",
 * //            "coordinates": [
 * //                -120.4623,
 * //                37.33503
 * //            ]
 * //        },
 * //        ... (excerpted for brevity)
 * //     },
 * //   ]
 * ```
 *
 * @module
 */
import { APIError, jsonCall } from "$http";
import type { MonitorClosestType, MonitorEntryType } from "./types.ts";

/**
 * Checks if a given monitor with a pm25 entry passes the prerequisites to be presented as the closest monitor
 *
 * @param monitor A monitor object with a pm25 latest entry
 *
 * @returns A boolean indicating whether or not the monitor has passed the conditions
 */
function pm25Validation(monitor: MonitorClosestType<"pm25">) {
  const negativeMin = -15;
  const valueMax = 400;

  let latestValue = parseFloat(monitor.latest.value);
  latestValue = (latestValue < 0 && latestValue >= negativeMin)
    ? 0
    : latestValue;

  return (latestValue >= 0 && latestValue <= valueMax);
}

/**
 * Checks if a given monitor passes the conditions to be presented as the closest monitor
 *
 * @param monitor A monitor object containing at least the "device", "id", and "latest" fields
 *
 * @returns A boolean indicating whether or not the monitor has passed the conditions
 */
export function isValidClosestMonitor<T extends MonitorEntryType>(
  monitor: MonitorClosestType<T>,
): boolean {
  switch (monitor.latest.entry_type) {
    case "pm25":
      return pm25Validation(monitor as MonitorClosestType<"pm25">);

    default:
      console.error(
        `Closest monitor validation is not configured for entry types of ${monitor.latest.entry_type}`,
      );
      return false;
  }
}

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param entryType The type of entry to include in the "latest" field
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns An Array containing the 3 closest monitors to a given set of coordinates.
 */
export async function getClosestMonitors<T extends MonitorEntryType>(
  entryType: T,
  latitude: number | string,
  longitude: number | string,
): Promise<Array<MonitorClosestType<T>>> {
  return await jsonCall<Array<MonitorClosestType<T>>>(
    {
      url: `monitors/${entryType}/closest`,
      searchParams: {
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      },
    },
    (response) => {
      if (
        !Array.isArray(response.body.data) || response.body.data.length <= 0
      ) {
        throw new APIError("Failed to closest monitors", response);
      }
    },
  );
}

/**
 * Fetches the closest monitors to a given set of coordinates.
 *
 * @param entryType The type of entry to include in the "latest" field
 * @param latitude The latitudinal coordinate of the desired location
 * @param longitude The longitudinal coordinate of the desired location
 *
 * @returns The closest monitor that passes basic validation.
 */
export async function getClosestMonitor<T extends MonitorEntryType>(
  entryType: T,
  latitude: number | string,
  longitude: number | string,
): Promise<MonitorClosestType<T>> {
  const monitors = await getClosestMonitors(entryType, latitude, longitude);
  const validatedMonitors: Array<MonitorClosestType<T>> = monitors.filter(
    isValidClosestMonitor,
  );

  if (!validatedMonitors.length) {
    throw new Error("All returned monitors failed validation");
  }

  const monitor = validatedMonitors.shift()!;

  return monitor;
}
