import { fetchMonitorsLatest } from "./fetchers.ts";
import type { MonitorDataField, MonitorLatest } from "../types.ts";

/**
 * Fetches all monitors with a "latest" entry.
 *
 * @returns An array containing all monitors with a "latest" entry.
 */
export async function getMonitorsLatest<
  T extends MonitorDataField,
>(
  field: T,
): Promise<Array<MonitorLatest<T>>> {
  try {
    const result = await fetchMonitorsLatest(field);
    return result.body.data;
  } catch (error) {
    throw new Error("Failed to fetch monitors latest page", { cause: error });
  }
}
