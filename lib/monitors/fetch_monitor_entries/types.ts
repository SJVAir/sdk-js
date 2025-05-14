import type {
  MonitorDataField,
  MonitorEntries,
  PaginatedResponse,
} from "../types.ts";
import type { APIRequestResponse } from "$http";

/**
 * The configuration options for the monitor entries endpoint
 */
export interface MonitorEntryRequestConfig {
  /** Fields to include on the monitor entry */
  field: MonitorDataField;

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
export type MonitorEntryRequestResponse<T extends MonitorDataField> =
  PaginatedResponse<MonitorEntries[T]>;

/**
 * The data structure returned from the "/monitors/<monitor_id>/entries/<entry_type>/" endpoint
 */
export type FetchMonitorEntriesResponse<T extends MonitorDataField> =
  APIRequestResponse<MonitorEntryRequestResponse<T>>;
