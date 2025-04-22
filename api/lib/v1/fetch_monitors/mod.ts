import { apiRequest, getApiV1Url } from "../../http/mod.ts";
import type { MonitorData } from "../../types.ts";

/**
 * Constructs the URL for getting the "monitors" api endpoint.
 *
 * @returns An instance of URL configured for the "monitors" api endpoint.
 */
export function getMonitorsUrl(): URL {
  return getApiV1Url("monitors");
}

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function fetchMonitors(): Promise<Array<MonitorData>> {
  const requestUrl = getMonitorsUrl();

  return await apiRequest<{ data: Array<MonitorData> }>(requestUrl)
    .then((res) => {
      const { data } = res.body;
      return (data && data.length) ? data : [];
    });
}
