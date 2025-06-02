import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type { MonitorClosest, MonitorDataField } from "../types.ts";

export type DefaultClosestMonitor = MonitorClosest<
  typeof DEFAULT_DISPLAY_FIELD
>;

export type ClosestMonitorsResponse<T extends MonitorDataField> =
  PaginatedResponse<
    MonitorClosest<T>
  >;

/**
 * The data structure returned from the "/monitors/<entry_type>/closest/" endpoint
 */
export type FetchClosestMonitorsResponse<T extends MonitorDataField> =
  APIRequestResponse<ClosestMonitorsResponse<T>>;
