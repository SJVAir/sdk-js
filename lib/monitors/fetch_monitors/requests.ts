import type { MonitorData } from "../types.ts";
import { fetchMonitors } from "./fetchers.ts";
import { fetchMonitorsHandler } from "./response_handlers.ts";

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitors(): Promise<Array<MonitorData>> {
  return await fetchMonitors()
    .then(fetchMonitorsHandler);
}
