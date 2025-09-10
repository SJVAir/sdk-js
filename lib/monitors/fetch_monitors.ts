import { apiCall, APIError } from "$http";
import type { MonitorData } from "./types.ts";

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitors(): Promise<Array<MonitorData>> {
  return await apiCall<Array<MonitorData>>(
    "monitors",
    (response) => {
      const { data: monitors } = response.body;

      if (!Array.isArray(monitors) || monitors.length <= 0) {
        throw new APIError("Failed to fetch all monitors", response);
      }
      return monitors;
    },
  );
}
