import type { MonitorEntry } from "../types.ts";
import type {
  MonitorEntryRequestConfig,
  MonitorEntryRequestResponse,
} from "./types.ts";

/**
 * Fetch all pages of entries for a given monitor, with the provided request callback.
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
