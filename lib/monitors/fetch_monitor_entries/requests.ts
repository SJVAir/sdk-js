import { apiRequest } from "$http";
import { getMonitorEntriesUrl } from "./request_builders.ts";
//import { gatherMonitorEntries } from "./response_handlers.ts";
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
export async function fetchMonitorEntriesPage(
  config: MonitorEntryRequestConfig,
): Promise<FetchMonitorEntriesResponse> {
  const url = getMonitorEntriesUrl(config);

  return await apiRequest<MonitorEntryRequestResponse>(url);
}

/**
 * Fetch all pages of entries for a given monitor, using native fetch api
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
//export async function fetchMonitorEntries(
//  config: MonitorEntryRequestConfig,
//): Promise<Array<MonitorEntry>> {
//  return await gatherMonitorEntries(config, fetchMonitorEntriesPage);
//}
