import type { MonitorDataField } from "../types.ts";
import type { FetchMonitorsLatestResponse } from "./types.ts";

export function fetchMonitorsLatestHandler<T extends MonitorDataField>(
  response: FetchMonitorsLatestResponse<T>,
) {
  const { data } = response.body;
  return (data && Array.isArray(data)) ? data : [];
}
