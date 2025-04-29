import type { MonitorDevice, MonitorEntry } from "../types.ts";
import { getDisplayFields } from "../monitors/display-fields.ts";

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
  const [displayField] = getDisplayFields(monitor);

  if (monitor.latest === null || monitor.latest[displayField] === null) {
    return false;
  }

  const negativeMin = -15;
  const valueMax = 400;
  const valueMin = 0;

  let latestValue = parseFloat(monitor.latest[displayField]);
  latestValue = (latestValue < 0 && latestValue >= negativeMin)
    ? 0
    : latestValue;

  return (latestValue >= valueMin && latestValue <= valueMax);
}
