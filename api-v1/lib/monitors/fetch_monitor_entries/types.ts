import type { MonitorEntry } from "../types.ts";

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

/** The response object return from the "/monitors/{MONItOR_ID}/entries" endpoint */
export interface MonitorEntryRequestResponse {
  /** The monitor entries included in the current page of results */
  data: Array<MonitorEntry>;

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
