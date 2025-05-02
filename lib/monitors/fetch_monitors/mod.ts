import type { MonitorData } from "../types.ts";
import { fetchMonitors } from "./requests.ts";
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
