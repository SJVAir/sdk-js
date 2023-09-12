import { getUrl, apiDateFormat } from "./utils";
import type { MonitorData, MonitorEntry } from "@sjvair/types";

/**
 * The configuration options for the monitor entries endpoint
 */
export interface MonitorEntryRequestConfig {
  /** Fields to include on the monitor entry */
  fields?: string;

  /** The ID of the monitor for which entries will be fetched */
  monitorId: string;

  /** The results page number to fetch */
  page?: number;

  /** The sensor of which entries will be fetched */
  sensor?: string;

  /** The start time of the requested monitor sensor entry set */
  timestampGte: Date | string;

  /** The end time of the requested monitor sensor entry set */
  timestampLte?: Date | string;
}

/** The response object return from the "/monitors/{MONItOR_ID}/entries" endpoint */
export interface MonitorEntryRequestResponse<T extends MonitorEntry = MonitorEntry> {
  /** The monitor entries included in the current page of results */
  data: Array<T>;

  /** The current page of results fetched */
  page: number;

  /** The total count of results */
  count: number;

  /** The total amount of results pages */
  pages: number;

  /** Indicates whether there is a next page of results */
  has_next_page: boolean;

  /** Indicates wether there is a previous page of results */
  has_previous_page: boolean;
}

/**
 * A structure used for parsing MonitorEntryRequestConfig
 */
class MonitorEntryRequestOptions {
  /** Fields to include on the monitor entry */
  fields: string;

  /** The results page number to fetch */
  page: string = "1";

  /** The sensor of which entries will be fetched */
  sensor: string = "";

  // format: YYYY-MM-DD HH:MM:SS
  /** The start time of the requested monitor sensor entry set */
  timestamp__gte!: string;
  /** The end time of the requested monitor sensor entry set */
  timestamp__lte: string = "";

  /**
   * Constructs a new MonitorEntryRequestOptions object
   *
   * @param options A user defined MonitorEntryRequestConfig object
   */
  constructor(options: MonitorEntryRequestConfig) {
    this.fields = options.fields ?? "";
    this.page = options.page ? `${ options.page }` : "1";
    this.sensor = options.sensor ?? "";
    this.timestamp__gte = apiDateFormat(options.timestampGte);
    this.timestamp__lte = apiDateFormat(options.timestampLte ?? new Date());
  }
}

/**
 * Fetch entries for a given monitor
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function fetchMonitorEntries<T extends MonitorEntry = MonitorEntry>(
  config: MonitorEntryRequestConfig
): Promise<Array<T>> {
  const entries: Array<T> = [];
  const params = new MonitorEntryRequestOptions(config);

  const url = getUrl(`monitors/${ config.monitorId }/entries`, params);

  try {
    const response = await (await fetch(url)).json() as MonitorEntryRequestResponse<T>;
    entries.push(...response.data);

    return response.has_next_page
      ? await fetchMonitorEntries(Object.assign(config, { page: `${++response.page}`}))
      : entries;

  } catch(err) {
    console.error("Failed to fetch monitor entries", err);
    return [];
  }
}

/**
 * Fetch details about a monitor
 *
 * @param monitorId The ID of the requested monitor
 *
 * @returns A MonitorData object containing monitor details
 */
export async function fetchMonitorDetails(monitorId: string): Promise<MonitorData> {
  const url = getUrl(`monitors/${ monitorId }`);
  return fetch(url)
    .then(raw => raw.json())
    .then(res => res.data)
    .catch(err => {
      console.error("Failed to fetch monitor details", err);
      return {};
    });
}
