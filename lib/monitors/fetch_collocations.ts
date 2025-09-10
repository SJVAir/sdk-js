import type { APIRequestResponse, PaginatedResponse } from "$http";
import { getApiUrl } from "$http";

/**
 * The data structure returned from the "/monitors/" endpoint
 */
export type FetchCollocationsResponse = APIRequestResponse<
  PaginatedResponse<Collocation>
>;

/**
 * Constructs the URL for getting the "calibrations" api endpoint.
 *
 * @returns An instance of URL configured for the "calibrations" api endpoint.
 */
export function getCollocationsUrl(): URL {
  return getApiUrl("calibrations");
}

export function fetchCollocationsHandler(
  response: FetchCollocationsResponse,
): Array<Collocation> {
  const { data } = response.body;
  return (Array.isArray(data) && data.length) ? data : [];
}

/**
 * Fetches all collocations.
 *
 * @returns The raw "/calibrations" endpoint response
 */
export async function fetchCollocations(): Promise<FetchCollocationsResponse> {
  const requestUrl = getCollocationsUrl();

  return await apiRequest<PaginatedResponse<Collocation>>(requestUrl);
}

/**
 * Fetches all collocations.
 *
 * @returns An array containing all collocations.
 */
export async function getCollocations(): Promise<Array<Collocation>> {
  return await fetchCollocations()
    .then(fetchCollocationsHandler);
}
