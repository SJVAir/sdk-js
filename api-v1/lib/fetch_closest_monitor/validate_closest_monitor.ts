import type { MonitorData, MonitorEntry } from "@sjvair/utils/types";

const fieldsUsed: Array<keyof MonitorEntry> = [
  "pm25",
  "pm25_avg_15",
  "pm25_avg_60",
];

export function validateClosestMonitor(monitor: MonitorData): boolean {
  const negativeMin = -15;
  const valueMax = 400;
  const valueMin = 0;

  if (
    monitor.latest === null ||
    fieldsUsed.map((k) => monitor.latest![k] === null).includes(true)
  ) {
    return false;
  }

  let latestValue = parseFloat(monitor.latest.pm25!);
  latestValue = (latestValue < 0 && latestValue >= negativeMin)
    ? 0
    : latestValue;

  return (latestValue >= valueMin && latestValue <= valueMax);
}
