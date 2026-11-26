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
 *   wholeDays: true, // today, as a whole Pacific day
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
   * Round the range out to whole Pacific days: the start to the start of its
   * day, the end to the end of its day. Without it, the bounds are sent as
   * given (only ordered), however close together. Missing bounds default to
   * Pacific days either way.
   *
   * @example
   * ```ts
   * getMonitorEntriesCSVUrl({
   *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
   *   entryType: "pm25",
   *   timestampGte: "2026-11-02T17:00:00Z", // 9:00 Monday, Pacific
   *   timestampLte: "2026-11-04T11:00:00Z", // 3:00 Wednesday, Pacific
   *   wholeDays: true, // midnight Monday to the end of Wednesday
   * });
   * ```
   *
   * @defaultValue false
   */
  wholeDays?: boolean;
}

/**
 * Constructs the URL for getting the "monitors/${monitorID}/entries" api endpoint.
 *
 * @param config An object containing the monitor ID and search parameters
 * (including the optional `processor`, `stage` and `wholeDays`)
 *
 * @returns An instance of URL configured for the "monitors/${monitorID}/entries" api endpoint.
 */
export function getMonitorEntriesCSVUrl(
  config: MonitorEntryCSVRequestConfig,
): URL {
  const timestamps = getValidDateRange(
    config.timestampGte,
    config.timestampLte,
    { wholeDays: config.wholeDays },
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
