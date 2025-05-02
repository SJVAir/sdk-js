import type { MonitorData, MonitorDevice, MonitorEntry } from "../types.ts";

/**
 * Checks if a given monitor passes the conditions to be presented as the closest monitor
 *
 * @param monitor A monitor object containing at least the "device", "id", and "latest" fields
 *
 * @returns A boolean indicating whether or not the monitor has passed the conditions
 */
export function isValidClosestMonitor<
  T extends {
    id: string;
    device: MonitorDevice;
    latest: MonitorEntry | null;
  },
>(monitor: T): boolean {
  if (monitor.latest === null || monitor.latest.pm25 === null) {
    return false;
  }

  const negativeMin = -15;
  const valueMax = 400;
  const valueMin = 0;

  let latestValue = parseFloat(monitor.latest.pm25);
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
export function validateClosestMonitorResponse(
  monitors: Array<MonitorData>,
): MonitorData {
  if (!monitors.length) {
    throw new Error("Failed to get list of closest validatedMonitors");
  }

  const validatedMonitors: Array<MonitorData> = monitors.filter(
    isValidClosestMonitor,
  );

  if (!validatedMonitors.length) {
    throw new Error("All validatedMonitors failed validation");
  }

  const monitor = validatedMonitors.shift()!;
  if (monitor.latest && monitor.latest.pm25) {
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
