import type { MonitorDataField, MonitorLatest } from "../types.ts";
import type { FetchMonitorsLatestResponse } from "./types.ts";

export function fetchMonitorsLatestHandler<T extends MonitorDataField>(
  response: FetchMonitorsLatestResponse<T>,
): Array<MonitorLatest<T>> {
  const { data } = response.body;
  return (data && Array.isArray(data)) ? data : [];
}
