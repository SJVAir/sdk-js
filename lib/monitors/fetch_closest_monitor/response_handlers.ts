import type { MonitorClosestType, MonitorEntryType } from "../types.ts";
import type { FetchClosestMonitorsResponse } from "./types.ts";

export function fetchClosestMonitorsHandler<T extends MonitorEntryType>(
  response: FetchClosestMonitorsResponse<T>,
): Array<MonitorClosestType<T>> {
  const { data } = response.body;
  return (data && Array.isArray(data)) ? data : [];
}
