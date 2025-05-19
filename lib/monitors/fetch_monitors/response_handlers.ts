import type { MonitorData } from "../types.ts";
import type { FetchMonitorsResponse } from "./types.ts";

export function fetchMonitorsHandler(
  response: FetchMonitorsResponse,
): Array<MonitorData> {
  const { data } = response.body;
  return (data && data.length) ? data : [];
}
