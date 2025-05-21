import type { Collocation } from "../types.ts";
import type { FetchCollocationsResponse } from "./types.ts";

export function fetchCollocationsHandler(
  response: FetchCollocationsResponse,
): Array<Collocation> {
  const { data } = response.body;
  return (Array.isArray(data) && data.length) ? data : [];
}
