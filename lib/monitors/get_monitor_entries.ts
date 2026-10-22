/**
 * A utility function for getting the entries of a monitor.
 *
 * @example Usage
 * ```ts
 * import { getMonitorEntries } from "@sjvair/sdk/monitors/get_monitor_entries";
 *
 * const entries = await getMonitorEntries({
 *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
 *   entryType: "pm25",
 *   timestampGte: new Date("2023-09-01T00:00:00Z"),
 *   timestampLte: new Date("2023-09-03T00:00:00Z"),
 * });
 *
 * console.log(entries);
 * // Prints:
 * // [
 * //    {
 * //       "timestamp": "2025-09-11T11:17:02-07:00",
 * //       "stage": "cleaned",
 * //       "processor": "PM25_LCS_Cleaning",
 * //       "entry_type": "pm25",
 * //       "value": "6.70"
 * //   },
 * //   ... (more entries)
 * // ]
 * ```
 *
 * @module
 */
import { paginatedApiCall, type RequestOptions } from "$http";
import type { MonitorEntries, MonitorEntryType } from "./types.ts";
import { getValidDateRange, toApiTimestamp } from "$datetime";

/**
 * The configuration options for the monitor entries endpoint
 */
export interface MonitorEntryRequestConfig {
  /** The type of the desired entry */
  entryType: MonitorEntryType;

  /** The ID of the monitor for which entries will be fetched */
  monitorId: string;

  /** The results page number to fetch */
  page?: number;

  /** The sensor of which entries will be fetched */
  sensor?: string;

  /**
   * Only fetch entries made by this processor (e.g. a calibration's processor
   * name). Sent only when given.
   */
  processor?: string;

  /**
   * Only fetch entries at this stage (e.g. "raw", "cleaned", "calibrated").
   * Sent only when given; without it the server returns the monitor type's
   * default stage.
   */
  stage?: string;

  /**
   * The start time of the requested monitor sensor entry
   *
   * @defaultValue 3 days less than `MonitorEntryRequestResponse["timestampLte]`
   */
  timestampGte?: Date | number | string;

  /**
   * The end time of the requested monitor sensor entry
   *
   * @defaultValue The current date
   */
  timestampLte?: Date | number | string;

  /**
   * Send the timestamps exactly as given. By default two bounds within five
   * minutes of each other are widened to whole Pacific days; with `exact` they
   * are sent unchanged, for short windows such as the current hour. Missing
   * bounds still default as usual.
   *
   * @example
   * ```ts
   * await getMonitorEntries({
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
 * A structure used for parsing MonitorEntryRequestConfig
 */
class MonitorEntryRequestOptions {
  [key: string]: string;

  /** The results page number to fetch */
  page: string;

  /** The sensor of which entries will be fetched */
  sensor: string;

  /**
   * The start time of the requested monitor sensor entry
   * Format: UTC ISO 8601, e.g. 2026-10-22T07:00:00.000Z
   */
  timestamp__gte: string;

  /**
   * The end time of the requested monitor sensor entry
   * Format: UTC ISO 8601, e.g. 2026-10-23T06:59:59.999Z
   */
  timestamp__lte: string;

  // `processor` and `stage` are set only when given (through the index
  // signature), so they are left out of the query string otherwise.

  /**
   * Constructs a new MonitorEntryRequestOptions object
   *
   * @param options A user defined MonitorEntryRequestConfig object
   */
  constructor(options: MonitorEntryRequestConfig) {
    const timestamps = getValidDateRange(
      options.timestampGte,
      options.timestampLte,
      { exact: options.exact },
    );

    this.page = options.page?.toString() ?? "1";
    this.sensor = options.sensor ?? "";
    this.timestamp__gte = toApiTimestamp(timestamps.gte);
    this.timestamp__lte = toApiTimestamp(timestamps.lte);

    if (options.processor) this.processor = options.processor;
    if (options.stage) this.stage = options.stage;
  }
}

/**
 * Fetch all pages of entries for a given monitor, using native fetch api
 *
 * @param config An object containing the monitor ID and search parameters
 * (including the optional `processor`, `stage` and `exact`)
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitor entries
 */
export async function getMonitorEntries<
  T extends MonitorEntryRequestConfig,
>(
  config: T,
  options?: RequestOptions,
): Promise<Array<MonitorEntries[T["entryType"]]>> {
  const searchParams = new MonitorEntryRequestOptions(config);
  return await paginatedApiCall<MonitorEntries[T["entryType"]]>({
    url: `monitors/${config.monitorId}/entries/${config.entryType}`,
    searchParams,
    options,
  });
}
