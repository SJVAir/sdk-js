import { apiRequest } from "$http";
import { getMonitorsLatestUrl } from "./request_builders.ts";
import type { MonitorDataField, MonitorLatest } from "../types.ts";
import type { FetchMonitorsLatestResponse } from "./types.ts";

/**
 * Fetches all monitors.
 *
 * @returns The raw "/monitors" endpoint response
 */
export async function fetchMonitorsLatest<T extends MonitorDataField>(
  entryType: T,
): Promise<FetchMonitorsLatestResponse<T>> {
  const requestUrl = getMonitorsLatestUrl(entryType);

  return await apiRequest<{ data: Array<MonitorLatest<T>> }>(requestUrl);
}
