import type { APIRequestResponse } from "$http";
import type { MonitorDataField, MonitorLatestValue } from "../types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsLatestResponse<T extends MonitorDataField> =
  APIRequestResponse<
    { data: Array<MonitorLatestValue<T>> }
  >;
