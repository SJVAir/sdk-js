import { paginatedApiCall } from "$http";
import type { MonitorEntries, MonitorEntryType } from "./types.ts";
import { apiDateFormat } from "$datetime";

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
 * Ensures a timestamp is prior to the current moment and represented by a Date object.
 *
 * @param timestamp The timestamp to validate.
 *
 * @returns A valid Date object.
 */
function getValidDate(timestamp: Date | string | number): Date {
  if (!(timestamp instanceof Date)) {
    timestamp = new Date(timestamp);
  }

  if (isNaN(timestamp as unknown as number)) {
    throw new Error(
      `Provided timestamp "${timestamp}" cannot be used to construct a valid Date`,
    );
  } else if (timestamp > new Date()) {
    throw new Error(`Provided timestamp "${timestamp}" is greater than now`);
  }

  return timestamp;
}

/**
 * Derives the GTE timestamp from the provided LTE timestamp.
 *
 * @param timestampLte A valid Date object.
 *
 * @returns A Date object set 3 days prior to the given timestampLte.
 */
function deriveTimestampGte(timestampLte: Date) {
  const timestampGte = new Date(timestampLte);
  timestampGte.setDate(timestampLte.getDate() - 3);
  timestampGte.setHours(0, 0, 0, 0);

  return timestampGte;
}

/**
 * The data structure returned by getValidDateRange.
 */
type DateRange = { gte: Date; lte: Date };
/**
 * Get a valid date range from the provided timestamps, if any.
 *
 * @param timestampGte The beginning timestamp of the date range
 * @param timestampLte The ending timestamp of the date range
 *
 * @returns A DateRange object ready to be consumed by the SJVAir
 */
function getValidDateRange(
  timestampGte?: Date | string | number,
  timestampLte?: Date | string | number,
): DateRange {
  const gteDefined = timestampGte !== undefined;
  const lteDefined = timestampLte !== undefined;

  if (!gteDefined && !lteDefined) {
    timestampLte = new Date();
    timestampLte.setHours(23, 59, 59, 999);

    timestampGte = deriveTimestampGte(timestampLte);
  } else if (gteDefined && !lteDefined) {
    timestampGte = getValidDate(timestampGte!);

    timestampLte = new Date(timestampGte);
    timestampLte.setDate(timestampGte.getDate() + 3);
    timestampLte.setHours(23, 59, 59, 999);
  } else if (!gteDefined && lteDefined) {
    timestampLte = getValidDate(timestampLte!);
    timestampGte = deriveTimestampGte(timestampLte);
  }

  return { gte: timestampGte, lte: timestampLte } as DateRange;
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
