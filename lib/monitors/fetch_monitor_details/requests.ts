import { apiRequest } from "$http";
import { getMonitorDetailsUrl } from "./request_builders.ts";
import type { FetchMonitorDetailssResponse } from "./types.ts";

/**
 * Fetch details about a monitor
 *
 * @param monitorId The ID of the requested monitor
 *
 * @returns A MonitorData object containing monitor details
 */
export async function fetchMonitorDetails(
  monitorId: string,
): Promise<FetchMonitorDetailssResponse> {
  const url = getMonitorDetailsUrl(monitorId);
  return await apiRequest(url);
}
