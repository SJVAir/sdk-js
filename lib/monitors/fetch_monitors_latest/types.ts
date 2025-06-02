import type { APIRequestResponse } from "$http";
import type { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type { MonitorDataField, MonitorLatest } from "../types.ts";

/**
 * The default data structure for monitors including a "latest" field
 */
export type DefaultLatestMonitor = MonitorLatest<typeof DEFAULT_DISPLAY_FIELD>;

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsLatestResponse<T extends MonitorDataField> =
  APIRequestResponse<
    { data: Array<MonitorLatest<T>> }
  >;
