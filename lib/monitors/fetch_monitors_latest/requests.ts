import { fetchMonitorsLatest } from "./fetchers.ts";
import type { MonitorEntryType, MonitorLatestType } from "../types.ts";

/**
 * Fetches all monitors with a "latest" entry.
 *
 * @returns An array containing all monitors with a "latest" entry.
 */
export async function getMonitorsLatest<
  T extends MonitorEntryType,
>(
  field: T,
): Promise<Array<MonitorLatestType<T>>> {
  try {
    const result = await fetchMonitorsLatest(field);
    return result.body.data;
  } catch (error) {
    throw new Error("Failed to fetch monitors latest page", { cause: error });
  }
}
