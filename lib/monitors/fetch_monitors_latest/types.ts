import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type { MonitorDataField, MonitorLatest } from "../types.ts";

/**
 * The configuration options for the monitors latest endpoint
 */
export interface MonitorsLatestRequestConfig {
  /** Fields to include on the monitor entry */
  field: MonitorDataField;

  /** The results page number to fetch */
  page?: number;
}

/**
 * The default data structure for monitors including a "latest" field
 */
export type DefaultLatestMonitor = MonitorLatest<typeof DEFAULT_DISPLAY_FIELD>;

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsLatestResponse<T extends MonitorDataField> =
  APIRequestResponse<PaginatedResponse<MonitorLatest<T>>>;
