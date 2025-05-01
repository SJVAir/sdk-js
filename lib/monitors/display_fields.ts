import type { MonitorDataFieldName, MonitorDevice } from "./types.ts";

/**
 * Get a list of the fields used to display data based on the monitor's device type
 *
 * @param monitor A monitor object containing at least the "device" and "id" fields
 *
 * @returns An Array containing all fo the fields used to display data, ordered by priority
 */
export function getDisplayFields<
  T extends {
    device: MonitorDevice;
    id: string;
  },
>(
  monitor: T,
): Array<MonitorDataFieldName> {
  if (monitor.device === "UNKNOWN") {
    throw new Error(
      `Failed to get display field: Monitor ${monitor.id} device type is UNKNOWN`,
    );
  }

  switch (monitor.device) {
    case "PA-I":
    case "PA-I-LED":
    case "PA-II":
    case "PA-II-SD":
    case "PA-II-FLEX":
    case "PurpleAir":
      return ["pm25", "pm25_avg_60"];

    case "BAM 1020":
    case "BAM 1022":
      return ["pm25_avg_60"];
  }
}
