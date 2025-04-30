import type { MonitorData } from "../types.ts";
import { fetchMonitorsRaw } from "./requests.ts";
import { fetchMonitorsHandler } from "./response_handlers.ts";

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function fetchMonitors(): Promise<Array<MonitorData>> {
  return await fetchMonitorsRaw()
    .then(fetchMonitorsHandler);
}
