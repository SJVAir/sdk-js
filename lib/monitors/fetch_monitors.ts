import { apiRequest, type APIRequestResponse, getApiUrl } from "$http";
import type { MonitorData } from "./types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchMonitorsResponse = APIRequestResponse<
  { data: Array<MonitorData> }
>;

// TODO: This should accept the response body as an argument
// not the whole response object. This way it is more useful
// with other http request libs
export function fetchMonitorsHandler(
  response: FetchMonitorsResponse,
): Array<MonitorData> {
  const { data } = response.body;
  return (data && data.length) ? data : [];
}

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitors(): Promise<FetchMonitorsResponse> {
  return await apiRequest<{ data: Array<MonitorData> }>(
    getApiUrl("monitors"),
  );
}
