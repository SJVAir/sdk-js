import { getApiUrl } from "$http";
import type { MonitorEntryType } from "./types.ts";
import { apiDateFormat, getValidDateRange } from "$datetime";

/**
 * The configuration options for the monitor entries endpoint
 */
export interface MonitorEntryCSVRequestConfig {
  /** Fields to include on the monitor entry */
  entryType: MonitorEntryType;

  /** The ID of the monitor for which entries will be fetched */
  monitorId: string;

  /**
   * The start time of the requested monitor sensor entry
   *
   * @defaultValue 3 days less than "timestampLte"
   */
  timestampGte?: Date | number | string;

  /**
   * The end time of the requested monitor sensor entry
   *
   * @defaultValue The current date
   */
  timestampLte?: Date | number | string;
}

/**
 * Constructs the URL for getting the "monitors/${monitorID}/entries" api endpoint.
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An instance of URL configured for the "monitors/${monitorID}/entries" api endpoint.
 */
export function getMonitorEntriesCSVUrl(
  config: MonitorEntryCSVRequestConfig,
): URL {
  const timestamps = getValidDateRange(
    config.timestampGte,
    config.timestampLte,
  );
  const params = {
    timestamp__gte: apiDateFormat(timestamps.gte),
    timestamp__lte: apiDateFormat(timestamps.lte),
  };
  return getApiUrl(
    `monitors/${config.monitorId}/entries/${config.entryType}/csv`,
    params,
  );
}
