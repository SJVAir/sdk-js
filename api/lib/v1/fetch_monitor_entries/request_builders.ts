import { getApiV1Url } from "../../http/mod.ts";
import { apiDateFormat } from "../../api_date_format/mod.ts";
import type { MonitorEntryRequestConfig } from "./types.ts";

function getValidLteDate(timestampLte: Date | string | number): Date {
  if (!(timestampLte instanceof Date)) {
    timestampLte = new Date(timestampLte);
  }

  if (isNaN(timestampLte as unknown as number)) {
    throw new Error(
      `Provided timestampLte cannot be used to construct a valid Date`,
    );
  } else {
    const date = new Date(timestampLte.toLocaleDateString());

    if (date > new Date(new Date().toLocaleDateString())) {
      throw new Error("Provided timestampLte is greater than today");
    }
  }

  return timestampLte;
}

/**
 * A structure used for parsing MonitorEntryRequestConfig
 */
class MonitorEntryRequestOptions {
  [key: string]: string;

  /** Fields to include on the monitor entry */
  fields: string;

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
    const date = (options.timestampLte)
      ? getValidLteDate(options.timestampLte)
      : new Date();

    this.fields = options.fields ?? "";
    this.page = options.page?.toString() ?? "1";
    this.sensor = options.sensor ?? "";
    this.timestamp__lte = apiDateFormat(date);
    this.timestamp__gte = apiDateFormat(date.setDate(date.getDate() - 3));
  }
}

/**
 * Constructs the URL for getting the "monitors/${monitorID}/entries" api endpoint.
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An instance of URL configured for the "monitors/${monitorID}/entries" api endpoint.
 */
export function getMonitorEntriesUrl(config: MonitorEntryRequestConfig): URL {
  const params = new MonitorEntryRequestOptions(config);
  return getApiV1Url(`monitors/${config.monitorId}/entries`, params);
}
