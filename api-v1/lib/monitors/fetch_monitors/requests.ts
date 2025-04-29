import { apiRequest } from "$http";
import { getMonitorsUrl } from "./request_builders.ts";
import type { MonitorData } from "../types.ts";
import type { FetchMonitorsResponse } from "./types.ts";

/**
 * Fetches all monitors.
 *
 * @returns The raw "/monitors" endpoint response
 */
export async function fetchMonitorsRaw(): Promise<FetchMonitorsResponse> {
  const requestUrl = getMonitorsUrl();

  return await apiRequest<{ data: Array<MonitorData> }>(requestUrl);
}
