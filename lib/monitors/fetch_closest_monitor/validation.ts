import type { MonitorClosestType, MonitorEntryType } from "../types.ts";

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
  const valueMin = 0;

  let latestValue = parseFloat(monitor.latest.value);
  latestValue = (latestValue < 0 && latestValue >= negativeMin)
    ? 0
    : latestValue;

  return (latestValue >= valueMin && latestValue <= valueMax);
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
      console.log(
        `Closest monitor validation is not configured for entry types of ${monitor.latest.entry_type}`,
      );
      return false;
  }
}

/**
 * Validates the data returned from the "monitors/closest" API endpoint.
 *
 * @param monitors An array containing monitor data.
 *
 * @returns The closest monitor that passed validation
 */
export function validateClosestMonitors<T extends MonitorEntryType>(
  monitors: Array<MonitorClosestType<T>>,
): MonitorClosestType<T> {
  if (!monitors.length) {
    throw new Error("Failed to get list of closest validatedMonitors");
  }

  const validatedMonitors: Array<MonitorClosestType<T>> = monitors.filter(
    isValidClosestMonitor,
  );

  if (!validatedMonitors.length) {
    throw new Error("All validatedMonitors failed validation");
  }

  const monitor = validatedMonitors.shift()!;

  // This should be done in the client code if so desired
  //if (monitor.latest && monitor.latest.value) {
  //  if (parseInt(monitor.latest.value, 10) < 0) {
  //    monitor.latest.value = "0";
  //  }
  //}

  return monitor;
}
