import type { MonitorDataField } from "../types.ts";
import type { FetchClosestMonitorsResponse } from "./types.ts";

export function fetchClosestMonitorsHandler<T extends MonitorDataField>(
  response: FetchClosestMonitorsResponse<T>,
) {
  const { data } = response.body;
  return data;
}
