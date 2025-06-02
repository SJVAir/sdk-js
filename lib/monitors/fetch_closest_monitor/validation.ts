import type { DefaultClosestMonitor } from "./types.ts";

/**
 * Checks if a given monitor passes the conditions to be presented as the closest monitor
 *
 * @param monitor A monitor object containing at least the "device", "id", and "latest" fields
 *
 * @returns A boolean indicating whether or not the monitor has passed the conditions
 */
export function isValidClosestMonitor(
  monitor: DefaultClosestMonitor,
): boolean {
  if (monitor.latest === null || monitor.latest?.value === null) {
    return false;
  }

  const negativeMin = -15;
  const valueMax = 400;
  const valueMin = 0;

  let latestValue = parseFloat(monitor.latest!.value);
  latestValue = (latestValue < 0 && latestValue >= negativeMin)
    ? 0
    : latestValue;

  return (latestValue >= valueMin && latestValue <= valueMax);
}

/**
 * Validates the data returned from the "monitors/closest" API endpoint.
 *
 * @param monitors An array containing monitor data.
 *
 * @returns The closest monitor that passed validation
 */
export function validateClosestMonitors(
  monitors: Array<DefaultClosestMonitor>,
): DefaultClosestMonitor {
  if (!monitors.length) {
    throw new Error("Failed to get list of closest validatedMonitors");
  }

  const validatedMonitors: Array<DefaultClosestMonitor> = monitors.filter(
    isValidClosestMonitor,
  );

  if (!validatedMonitors.length) {
    throw new Error("All validatedMonitors failed validation");
  }

  const monitor = validatedMonitors.shift()!;
  if (monitor.latest && monitor.latest.value) {
    if (parseInt(monitor.latest.value, 10) < 0) {
      monitor.latest.value = "0";
    }
  }

  return monitor;
}
