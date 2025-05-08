import { apiRequest } from "$http";
import { getMonitorEntriesUrl } from "./request_builders.ts";
import type {
  FetchMonitorEntriesResponse,
  MonitorEntryRequestConfig,
  MonitorEntryRequestResponse,
} from "./types.ts";

/**
 * Fetch a single page of entries for a given monitor
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function fetchMonitorEntriesPage<
  T extends MonitorEntryRequestConfig,
>(
  config: T,
): Promise<FetchMonitorEntriesResponse<T["field"]>> {
  const url = getMonitorEntriesUrl(config);

  return await apiRequest<MonitorEntryRequestResponse<T["field"]>>(url);
}
