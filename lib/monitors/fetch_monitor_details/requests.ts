import { fetchMonitorDetailsHandler } from "./response_handlers.ts";
import { fetchMonitorDetails } from "./fetchers.ts";
import type { MonitorDetails } from "../types.ts";

/**
 * Fetch details about a monitor
 *
 * @param monitorId The ID of the requested monitor
 *
 * @returns A MonitorData object containing monitor details
 */
export async function getMonitorDetails(
  monitorId: string,
): Promise<MonitorDetails> {
  return await fetchMonitorDetails(monitorId)
    .then(fetchMonitorDetailsHandler);
}
