import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { MonitorClosestType, MonitorEntryType } from "../types.ts";

export type ClosestMonitorsResponse<T extends MonitorEntryType> =
  PaginatedResponse<
    MonitorClosestType<T>
  >;

/**
 * The data structure returned from the "/monitors/<entry_type>/closest/" endpoint
 */
export type FetchClosestMonitorsResponse<T extends MonitorEntryType> =
  APIRequestResponse<ClosestMonitorsResponse<T>>;
