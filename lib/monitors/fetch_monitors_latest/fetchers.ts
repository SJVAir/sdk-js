import { apiRequest, type PaginatedResponse } from "$http";
import { getMonitorsLatestUrl } from "./request_builders.ts";
import type { MonitorDataField, MonitorLatest } from "../types.ts";
import type {
  FetchMonitorsLatestResponse,
  MonitorsLatestRequestConfig,
} from "./types.ts";

/**
 * Fetches all monitors with a "latest" entry.
 *
 * @returns The raw "/monitors/<entry_type>/current/" endpoint response
 */
export async function fetchMonitorsLatestPage<T extends MonitorDataField>(
  config: MonitorsLatestRequestConfig,
): Promise<FetchMonitorsLatestResponse<T>> {
  const requestUrl = getMonitorsLatestUrl(config);

  return await apiRequest<PaginatedResponse<MonitorLatest<T>>>(requestUrl);
}
