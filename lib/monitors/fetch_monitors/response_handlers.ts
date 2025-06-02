import type { MonitorData } from "../types.ts";
import type { FetchMonitorsResponse } from "./types.ts";

// TODO: This should accept the response body as an argument
// not the whole response object. This way it is more useful
// with other http request libs
export function fetchMonitorsHandler(
  response: FetchMonitorsResponse,
): Array<MonitorData> {
  const { data } = response.body;
  return (data && data.length) ? data : [];
}
