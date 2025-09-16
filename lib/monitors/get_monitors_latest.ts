import { jsonCall } from "$http";
import type { MonitorEntryType, MonitorLatestType } from "./types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type MonitorsLatestResponse<T extends MonitorEntryType> = {
  data: Array<MonitorLatestType<T>>;
};

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
  return await jsonCall<Array<MonitorLatestType<T>>>(
    `monitors/${field}/current`,
  );
}
