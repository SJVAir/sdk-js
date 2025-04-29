import type { APIRequestResponse } from "$http";
import type { MonitorData } from "../types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsResponse = APIRequestResponse<
  { data: Array<MonitorData> }
>;
