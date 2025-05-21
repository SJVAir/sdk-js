import { apiRequest, type PaginatedResponse } from "$http";
import { getCollocationsUrl } from "./request_builders.ts";
import type { Collocation } from "../types.ts";
import type { FetchCollocationsResponse } from "./types.ts";

/**
 * Fetches all collocations.
 *
 * @returns The raw "/calibrations" endpoint response
 */
export async function fetchCollocations(): Promise<FetchCollocationsResponse> {
  const requestUrl = getCollocationsUrl();

  return await apiRequest<PaginatedResponse<Collocation>>(requestUrl);
}
