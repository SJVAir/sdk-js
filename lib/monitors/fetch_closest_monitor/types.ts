import type { APIRequestResponse } from "$http";
import type { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type {
  MonitorDataField,
  MonitorLatest,
  PaginatedResponse,
} from "../types.ts";

export type DefaultLatestMonitor = MonitorLatest<typeof DEFAULT_DISPLAY_FIELD>;

export type ClosestMonitorsResponse<T extends MonitorDataField> =
  PaginatedResponse<
    MonitorLatest<T>
  >;

/**
 * The data structure returned from the "/monitors/<entry_type>/closest/" endpoint
 */
export type FetchClosestMonitorsResponse<T extends MonitorDataField> =
  APIRequestResponse<ClosestMonitorsResponse<T>>;
