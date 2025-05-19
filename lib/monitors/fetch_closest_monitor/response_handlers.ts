import type { MonitorClosest, MonitorDataField } from "../types.ts";
import type { FetchClosestMonitorsResponse } from "./types.ts";

export function fetchClosestMonitorsHandler<T extends MonitorDataField>(
  response: FetchClosestMonitorsResponse<T>,
): Array<MonitorClosest<T>> {
  const { data } = response.body;
  return (data && Array.isArray(data)) ? data : [];
}
