import { consolidatePaginatedRequest } from "$http";
import { fetchMonitorEntriesPage } from "./fetchers.ts";
import type { MonitorEntries } from "../types.ts";
import type { MonitorEntryRequestConfig } from "./types.ts";

async function getMonitorEntriesPage<
  T extends MonitorEntryRequestConfig,
>(
  config: T,
) {
  try {
    const result = await fetchMonitorEntriesPage(config);
    return result.body;
  } catch (error) {
    throw new Error("Failed to fetch monitor entries page", { cause: error });
  }
}

/**
 * Fetch all pages of entries for a given monitor, using native fetch api
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function getMonitorEntries<
  T extends MonitorEntryRequestConfig,
>(
  config: T,
): Promise<Array<MonitorEntries[T["field"]]>> {
  return await consolidatePaginatedRequest(config, getMonitorEntriesPage);
}
