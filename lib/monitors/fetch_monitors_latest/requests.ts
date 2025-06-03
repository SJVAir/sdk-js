import { consolidatePaginatedRequest } from "$http";
import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type { MonitorLatest } from "../types.ts";
import { fetchMonitorsLatestPage } from "./fetchers.ts";
import type {
  DefaultLatestMonitor,
  MonitorsLatestRequestConfig,
} from "./types.ts";

async function getMonitorsLatestPage<
  T extends MonitorsLatestRequestConfig,
>(
  config: T,
) {
  try {
    const result = await fetchMonitorsLatestPage(config);
    return result.body;
  } catch (error) {
    throw new Error("Failed to fetch monitors latest page", { cause: error });
  }
}

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
  return await consolidatePaginatedRequest(config, getMonitorsLatestPage);
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
