import { apiCall } from "$http";
import type { MonitorDetails } from "./types.ts";

/**
 * The data structure returned from the "/monitors/{ MONITOR_ID }/" endpoint
 */
export type MonitorDetailsResponse = { data: MonitorDetails };

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
  return await apiCall<MonitorDetailsResponse, MonitorDetails>(
    `monitors/${monitorId}`,
    (status, body) => {
      if (status !== 200) {
        console.error("Unexpected status code:", status);
      }
      return body.data;
    },
  );
}
