import { APIError, jsonCall } from "$http";
import type { MonitorData } from "./types.ts";

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitors(): Promise<Array<MonitorData>> {
  return await jsonCall<Array<MonitorData>>(
    "monitors",
    (response) => {
      if (
        !Array.isArray(response.body.data) || response.body.data.length <= 0
      ) {
        throw new APIError("Failed to fetch all monitors", response);
      }
    },
  );
}
