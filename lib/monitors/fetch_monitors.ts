import { apiCall } from "$http";
import type { MonitorData } from "./types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsResponse = { data: Array<MonitorData> };

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitors(): Promise<Array<MonitorData>> {
  return await apiCall<FetchMonitorsResponse, Array<MonitorData>>(
    "monitors",
    (status, body) => {
      const { data: monitors } = body;
      if (status !== 200) {
        console.error("Unexpected status code:", status);
      }

      if (!Array.isArray(monitors) || monitors.length <= 0) {
        throw new Error("Failed to fetch all monitors", {
          cause: { status, body },
        });
      }
      return monitors;
    },
  );
}
