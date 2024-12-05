import { apiRequest } from "../http/mod.ts";
import type { MonitorEntry } from "../types.ts";
import { getMonitorEntriesUrl } from "./request_builders.ts";
import type {
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
): Promise<MonitorEntryRequestResponse> {
  const url = getMonitorEntriesUrl(config);

  return await apiRequest<MonitorEntryRequestResponse>(url)
    .then((response) => response.body);
}

/**
 * Fetch all pages of entries for a given monitor, with the provided request callback
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function gatherMonitorEntries(
  config: MonitorEntryRequestConfig,
  cb: (
    config: MonitorEntryRequestConfig,
  ) => Promise<MonitorEntryRequestResponse>,
): Promise<Array<MonitorEntry>> {
  const totalEntries: Array<MonitorEntry> = [];

  try {
    const entriesResponse = await cb(config);

    if (entriesResponse.data.length) {
      totalEntries.push(...entriesResponse.data);

      if (entriesResponse.has_next_page) {
        Object.assign(config, { page: `${++entriesResponse.page}` });
        await cb(config);
      }
    }

    return totalEntries;
  } catch (err) {
    console.error("Failed to fetch monitor entries", err);
    return [];
  }
}

/**
 * Fetch all pages of entries for a given monitor, using native fetch api
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function fetchMonitorEntries(
  config: MonitorEntryRequestConfig,
): Promise<Array<MonitorEntry>> {
  return await gatherMonitorEntries(config, fetchMonitorEntriesPage);
}
