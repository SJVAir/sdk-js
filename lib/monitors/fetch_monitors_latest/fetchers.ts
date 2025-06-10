import { apiRequest } from "$http";
import { getMonitorsLatestUrl } from "./request_builders.ts";
import type { MonitorDataField, MonitorLatest } from "../types.ts";
import type { FetchMonitorsLatestResponse } from "./types.ts";

/**
 * Fetches all monitors with a "latest" entry.
 *
 * @returns The raw "/monitors/<entry_type>/current/" endpoint response
 */
export async function fetchMonitorsLatest<T extends MonitorDataField>(
  field: T,
): Promise<FetchMonitorsLatestResponse<T>> {
  const requestUrl = getMonitorsLatestUrl(field);

  return await apiRequest<{ data: Array<MonitorLatest<T>> }>(requestUrl);
}
