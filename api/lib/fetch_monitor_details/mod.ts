import { getApiUrl } from "../http/mod.ts";
import type { MonitorData } from "../types.ts";

/**
 * Fetch details about a monitor
 *
 * @param monitorId The ID of the requested monitor
 *
 * @returns A MonitorData object containing monitor details
 */
export async function fetchMonitorDetails(
  monitorId: string,
): Promise<MonitorData> {
  const url = getApiUrl(`monitors/${monitorId}`);
  return await fetch(url)
    .then((raw) => raw.json())
    .then((res) => res.data)
    .catch((err) => {
      console.error("Failed to fetch monitor details", err);
      return {};
    });
}
