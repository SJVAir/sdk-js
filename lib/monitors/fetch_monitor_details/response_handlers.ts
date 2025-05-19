import type { FetchMonitorDetailssResponse } from "./types.ts";

export function fetchMonitorDetailsHandler(
  response: FetchMonitorDetailssResponse,
) {
  const { data } = response.body;
  return data;
}
