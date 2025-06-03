import { consolidateApiRequest } from "$http";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type { MonitorLatest } from "../types.ts";
import { fetchMonitorsLatestPage } from "./fetchers.ts";
import type {
  DefaultLatestMonitor,
  MonitorsLatestRequestConfig,
} from "./types.ts";

/**
 * Fetches all monitors with a "latest" entry.
 *
 * @returns An array containing all monitors with a "latest" entry.
 */
export async function consolidateMonitorsLatest<
  T extends MonitorsLatestRequestConfig,
>(
  config: T,
): Promise<
  Array<MonitorLatest<T["field"]>>
> {
  return await consolidateApiRequest(config, fetchMonitorsLatestPage);
}

/**
 * Fetch all monitors with a "latest" PM2.5 entry
 *
 * @returns An array containing all monitors with a "latest" PM2.5 entry.
 */
export async function getMonitorsLatest(): Promise<
  Array<DefaultLatestMonitor>
> {
  return await consolidateMonitorsLatest({ field: DEFAULT_DISPLAY_FIELD });
}
