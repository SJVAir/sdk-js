import type { MonitorData } from "../../types.ts";

export function validateClosestMonitor(monitor: MonitorData): boolean {
  const negativeMin = -15;
  const valueMax = 400;
  const valueMin = 0;

  let latestValue = (monitor.latest !== null)
    ? parseFloat(monitor.latest.pm25)
    : valueMax + 1;
  latestValue = (latestValue < 0 && latestValue >= negativeMin)
    ? 0
    : latestValue;

  return (latestValue >= valueMin && latestValue <= valueMax);
}
