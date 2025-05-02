import type { APIRequestResponse } from "$http";
import type { MonitorDetails } from "../types.ts";

/**
 * The data structure returned from the "/monitors/{ MONITOR_ID }/" endpoint
 */
export type FetchMonitorDetailssResponse = APIRequestResponse<
  { data: MonitorDetails }
>;
