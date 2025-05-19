import type { FetchMonitorsResponse } from "./types.ts";

export function fetchMonitorsHandler(response: FetchMonitorsResponse) {
  const { data } = response.body;
  return (data && data.length) ? data : [];
}
