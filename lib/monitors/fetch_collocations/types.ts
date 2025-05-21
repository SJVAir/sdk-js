import type { APIRequestResponse, PaginatedResponse } from "$http";
import type { Collocation } from "../types.ts";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchCollocationsResponse = APIRequestResponse<
  PaginatedResponse<Collocation>
>;
