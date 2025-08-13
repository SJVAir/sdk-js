import type { APIRequestResponse } from "$http";
import type { MonitorEntryType, MonitorLatestType } from "../types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type MonitorsLatestResponse<T extends MonitorEntryType> = {
  data: Array<MonitorLatestType<T>>;
};

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsLatestResponse<T extends MonitorEntryType> =
  APIRequestResponse<MonitorsLatestResponse<T>>;
