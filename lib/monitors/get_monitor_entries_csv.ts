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
 * //    href: "https://www.sjvair.com/api/2.0/monitors/xgXCRh68SdG5FOdbUXvR6Q/entries/pm25/csv/?timestamp__gte=2025-09-25T07%3A00%3A00.000Z&timestamp__lte=2025-09-26T06%3A59%3A59.999Z",
 * //    origin: "https://www.sjvair.com",
 * //    protocol: "https:",
 * //    username: "",
 * //    password: "",
 * //    host: "www.sjvair.com",
 * //    hostname: "www.sjvair.com",
 * //    port: "",
 * //    pathname: "/api/2.0/monitors/xgXCRh68SdG5FOdbUXvR6Q/entries/pm25/csv/",
 * //    hash: "",
 * //    search: "?timestamp__gte=2025-09-25T07%3A00%3A00.000Z&timestamp__lte=2025-09-26T06%3A59%3A59.999Z"
 * //  }
 * ```
 *
 * @module
 */
import { getApiUrl } from "$http";
import type { MonitorEntryType } from "./types.ts";
import { getValidDateRange, toApiTimestamp } from "$datetime";

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

  /**
   * Only export entries made by this processor (e.g. a calibration's
   * processor name). Sent only when given.
   */
  processor?: string;

  /**
   * Only export entries at this stage (e.g. "raw", "cleaned", "calibrated").
   * Sent only when given.
   */
  stage?: string;

  /**
   * Send the timestamps exactly as given. By default two bounds within five
   * minutes of each other are widened to whole Pacific days; with `exact` they
   * are sent unchanged, for short windows such as the current hour. Missing
   * bounds still default as usual.
   *
   * @example
   * ```ts
   * getMonitorEntriesCSVUrl({
   *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
   *   entryType: "pm25",
   *   timestampGte: "2026-10-22T18:00:00Z",
   *   timestampLte: "2026-10-22T18:02:00Z",
   *   exact: true,
   * });
   * ```
   *
   * @defaultValue false
   */
  exact?: boolean;
}

/**
 * Constructs the URL for getting the "monitors/${monitorID}/entries" api endpoint.
 *
 * @param config An object containing the monitor ID and search parameters
 * (including the optional `processor`, `stage` and `exact`)
 *
 * @returns An instance of URL configured for the "monitors/${monitorID}/entries" api endpoint.
 */
export function getMonitorEntriesCSVUrl(
  config: MonitorEntryCSVRequestConfig,
): URL {
  const timestamps = getValidDateRange(
    config.timestampGte,
    config.timestampLte,
    { exact: config.exact },
  );
  const params: Record<string, string> = {
    timestamp__gte: toApiTimestamp(timestamps.gte),
    timestamp__lte: toApiTimestamp(timestamps.lte),
  };
  if (config.processor) params.processor = config.processor;
  if (config.stage) params.stage = config.stage;
  return getApiUrl(
    `monitors/${config.monitorId}/entries/${config.entryType}/csv`,
    params,
  );
}
