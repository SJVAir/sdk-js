import { paginatedApiCall } from "$http";
import type { MonitorEntries, MonitorEntryType } from "./types.ts";
import { apiDateFormat, getValidDateRange } from "$datetime";

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
   * Format: YYYY-MM-DD HH:MM:SS
   */
  timestamp__gte: string;

  /**
   * The end time of the requested monitor sensor entry
   * Format: YYYY-MM-DD HH:MM:SS
   */
  timestamp__lte: string;

  /**
   * Constructs a new MonitorEntryRequestOptions object
   *
   * @param options A user defined MonitorEntryRequestConfig object
   */
  constructor(options: MonitorEntryRequestConfig) {
    const timestamps = getValidDateRange(
      options.timestampGte,
      options.timestampLte,
    );

    this.page = options.page?.toString() ?? "1";
    this.sensor = options.sensor ?? "";
    this.timestamp__gte = apiDateFormat(timestamps.gte);
    this.timestamp__lte = apiDateFormat(timestamps.lte);
  }
}

/**
 * Fetch all pages of entries for a given monitor, using native fetch api
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function getMonitorEntries<
  T extends MonitorEntryRequestConfig,
>(
  config: T,
): Promise<Array<MonitorEntries[T["entryType"]]>> {
  const searchParams = new MonitorEntryRequestOptions(config);
  return await paginatedApiCall<MonitorEntries[T["entryType"]]>({
    url: `monitors/${config.monitorId}/entries/${config.entryType}`,
    searchParams,
  });
}
