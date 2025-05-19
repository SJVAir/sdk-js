import type { MonitorDetails } from "../types.ts";
import type { FetchMonitorDetailssResponse } from "./types.ts";

export function fetchMonitorDetailsHandler(
  response: FetchMonitorDetailssResponse,
): MonitorDetails {
  const { data } = response.body;
  return data;
}
