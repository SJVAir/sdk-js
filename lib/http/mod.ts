import { apiRequest } from "./requests.ts";
import { APIError, genericAPIErrorHandler } from "./error.ts";

export * from "./requests.ts";
export * from "./error.ts";

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

export interface APICallConfig {
  url: string;
  searchParams?: Record<string, string>;
  init?: RequestInit;
}

/**
 * A helper for making generic api calls to SJVAir.
 *
 * @param url The URL of the endpoint.
 * @param handler The handler for the reqeust response.
 *
 * @returns The return value from the handler.
 */
export async function apiCall<T, K>(
  endpoint: string | APICallConfig,
  handler: (status: number, body: T) => K,
): Promise<Awaited<K>> {
  const { url, searchParams, init } = (typeof endpoint === "string")
    ? { url: endpoint, init: {} }
    : endpoint;

  return await apiRequest<T>(
    getApiUrl(url, searchParams),
    init,
  ).then((response) => {
    const { ok, status, body } = response;

    if (!ok) {
      throw new APIError(`Request to "${url}" failed`, response);
    }

    return handler(status, body);
  }).catch(genericAPIErrorHandler) as Awaited<K>;
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
 * Fetch all pages of a paginated endpoint, with the provided request callback.
 *
 * @param config An object containing the desired page number, and any other options for the provided request callback.
 *
 * @returns An array of the consolidated response items
 */
export async function consolidatePaginatedRequest<
  T,
  K extends { page?: number },
>(
  config: K,
  cb: (config: K) => Promise<PaginatedResponse<T>>,
): Promise<Array<T>> {
  const totalEntries: Array<T> = [];

  try {
    const { data, has_next_page, page: _page, pages } = await cb(config);

    if (data.length) {
      totalEntries.push(...data);

      if (has_next_page) {
        const items = await Promise.all(
          Array.from(
            { length: pages - 1 },
            (_, idx) => cb({ ...config, page: `${idx + 2}` }),
          ),
        );
        totalEntries.push(...items.flatMap((response) => response.data));
      }
    }

    return totalEntries;
  } catch (err) {
    console.error("Failed to consolidate paginated request", err);
    return [] as Array<T>;
  }
}
