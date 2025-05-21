/**
 * The request response format when used with native fetch api
 */
export interface APIRequestResponse<T> {
  headers: Headers;
  body: T;
  ok: boolean;
  redirected: boolean;
  status: number;
  statusText: string;
  url: string;
}

/**
 * The data structure a paginated response from the server
 */
export interface PaginatedResponse<T> {
  /** The monitor entries included in the current page of results */
  data: Array<T>;

  /** The current page of results fetched */
  page: number;

  /** The total count of results */
  count: number;

  /** The total amount of results pages */
  pages: number;

  /** Indicates whether there is a next page of results */
  has_next_page: boolean;

  /** Indicates wether there is a previous page of results */
  has_previous_page: boolean;
}

/**
 * The default origin to use when making requests to the SJVAir API
 */
export let origin = "https://www.sjvair.com";

/**
 * Set the default origin to use when making requests to the SJVAir API
 *
 * @param newOrigin The desired origin to use when making requests from the SJVAir API
 */
export function setOrigin(newOrigin: string): void {
  origin = newOrigin;
}

/**
 * Constructs an SJVAir specific URL object
 *
 * @param endpoint Specific route to an endpoint (e.g. "/monitors")
 * @param version The desired api version to use
 * @param searchParams Key/Value object containing search parameters
 *
 * @returns A complete request URL for the SJVAir API
 */
export function getApiUrl(
  endpoint: string,
  searchParams?: Record<string, string>,
): URL {
  const url = new URL(`${origin}/api/2.0/${endpoint}/`);

  if (searchParams) {
    Object.entries(searchParams)
      .forEach((param) => url.searchParams.set(param[0], param[1]));
  }

  return url;
}

/**
 * Makes an HTTP request and assumes JSON response
 *
 * @param url The target URL for the request, including search parameters
 * @param config Standard fetch request options
 *
 * @returns The result of the request
 */
export async function apiRequest<T>(
  url: URL,
  config?: RequestInit,
): Promise<APIRequestResponse<T>> {
  return await fetch(url, config)
    .then(async (response) => {
      const body: T = await response.json()
        .catch((_) => {
          throw new Error(`Request to endpoint "${url.href}" failed`, {
            cause: response,
          });
        });

      return {
        headers: response.headers,
        body,
        ok: response.ok,
        redirected: response.redirected,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      };
    });
}
