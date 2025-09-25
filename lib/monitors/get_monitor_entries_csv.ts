/**
 * A utility function for generating the entries csv download url.
 *
 * @example Usage
 * ```ts
 * import { getMonitorEntriesCSVUrl } from "@sjvair/sdk/monitors/get_monitor_entries_csv";
 *
 * const url = await getMonitorEntriesCSVUrl({
 *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
 *   entryType: "pm25",
 *   timestampGte: new Date(),
 *   timestampLte: new Date(),
 * });
 *
 * console.log(url);
 * // Prints (example output):
 * //  URL {
 * //    href: "https://www.sjvair.com/api/2.0/monitors/xgXCRh68SdG5FOdbUXvR6Q/entries/pm25/csv/?timestamp__gte=2025-09-25+00%3A00%3A00&timestamp__lte=2025-09-25+23%3A59%3A59",
 * //    origin: "https://www.sjvair.com",
 * //    protocol: "https:",
 * //    username: "",
 * //    password: "",
 * //    host: "www.sjvair.com",
 * //    hostname: "www.sjvair.com",
 * //    port: "",
 * //    pathname: "/api/2.0/monitors/xgXCRh68SdG5FOdbUXvR6Q/entries/pm25/csv/",
 * //    hash: "",
 * //    search: "?timestamp__gte=2025-09-25+00%3A00%3A00&timestamp__lte=2025-09-25+23%3A59%3A59"
 * //  }
 * ```
 *
 * @module
 */
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
