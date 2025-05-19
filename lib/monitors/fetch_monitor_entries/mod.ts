import { fetchMonitorEntriesPage } from "./requests.ts";
import { gatherMonitorEntries } from "./response_handlers.ts";
import type { MonitorEntries } from "../types.ts";
import type { MonitorEntryRequestConfig } from "./types.ts";

/**
 * Fetch all pages of entries for a given monitor, using native fetch api
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function fetchMonitorEntries<
  T extends MonitorEntryRequestConfig,
>(
  config: T,
): Promise<Array<MonitorEntries[T["field"]]>> {
  return await gatherMonitorEntries(config, fetchMonitorEntriesPage);
}
