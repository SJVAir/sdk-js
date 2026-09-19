/**
 * A collection of utililties for creating HTTP requests to the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { jsonCall } from "@sjvair/sdk/http";
 *
 * const details = await jsonCall<MonitorLatest>("monitor/xgXCRh68SdG5FOdbUXvR6Q");
 * console.log(detals);
 * // Prints:
 * //  {
 * //    "id": "xgXCRh68SdG5FOdbUXvR6Q",
 * //    "name": "ucm-1ed",
 * //    "type": "purpleair",
 * //    "device": "PA-II",
 * //    "is_active": true,
 * //    "is_sjvair": true,
 * //    "position": {
 * //        "type": "Point",
 * //        "coordinates": [
 * //            -119.8551,
 * //            36.81932
 * //        ]
 * //    },
 * //    ... (excerpted for brevity)
 * //  }
 * ```
 *
 * @module
 */
import { genericAPIErrorHandler } from "./error.ts";
import { getApiUrl } from "./origin.ts";

/*
 * The configuration object for an API call
 */
export interface APIRequestConfig {
  url: string;
  searchParams?: Record<string, string | Array<string>>;
  init?: RequestInit;
}

/**
 * The generic request response format
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
 * Ensures an APIRequestConfig object by optionally coercing a string
 *
 * @param endpoint The target URL for the request, including search parameters
 *
 * @returns An APIRequestConfig object
 */
function getRequestConfig(
  endpoint: string | APIRequestConfig,
): APIRequestConfig {
  return (typeof endpoint === "string")
    ? { url: endpoint, init: {} }
    : endpoint;
}

async function parseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return response.body as T;
  }

  if (!response.headers.has("Content-Type")) {
    throw new Error(
      "Unable to handle server response, no Content-Type header was found",
    );
  }

  const contentType = response.headers.get("Content-Type");
  try {
    switch (contentType) {
      case "application/json":
        return await response.json() as T;

      case "text/csv":
        return await response.text() as T;

      default:
        throw new Error(
          `Not configured for parsing "${contentType}" content type`,
          { cause: response },
        );
    }
  } catch (error) {
    throw error;
  }
}

/**
 * Makes an HTTP request
 *
 * @param endpoint The target URL or APIRequestConfig
 *
 * @returns The result of the request
 */
export async function httpRequest<T>(
  endpoint: string | APIRequestConfig,
): Promise<APIRequestResponse<T>> {
  const { url: baseUrl, searchParams, init } = getRequestConfig(endpoint);

  const url = getApiUrl(baseUrl, searchParams);

  return await fetch(url, init)
    .then(async (response) => {
      const body: T = await parseBody(response);

      const result = {
        headers: response.headers,
        body,
        ok: response.ok,
        redirected: response.redirected,
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      } satisfies APIRequestResponse<T>;

      if (!result.ok) {
        throw new Error(`Request to "${url.href}" failed`, {
          cause: {
            url,
            init,
            result,
          },
        });
      }

      return result;
    }).catch(genericAPIErrorHandler) as APIRequestResponse<T>;
}

type APICallHandler<T> = (response: APIRequestResponse<T>) => void;
type AsyncAPICallHandler<T> = (
  response: APIRequestResponse<T>,
) => Promise<void>;

/**
 * A helper for making generic api calls to SJVAir.
 *
 * @param url The URL of the endpoint.
 * @param handler The handler for the reqeust response.
 *
 * @returns The return value from the handler.
 */
export async function apiCall<T>(
  endpoint: string | APIRequestConfig,
  handler?: APICallHandler<T> | AsyncAPICallHandler<T>,
): Promise<Awaited<T>> {
  return await httpRequest<T>(endpoint).then(async (response) => {
    if (handler) {
      const result = handler(response);

      if (result instanceof Promise) {
        return await result;
      }
    }

    return response.body;
  }).catch(genericAPIErrorHandler) as Awaited<T>;
}

/**
 * A helper for making generic api calls to SJVAir.
 *
 * @param url The URL of the endpoint.
 * @param validator The handler for the reqeust response.
 *
 * @returns The return value from the handler.
 */
export async function jsonCall<T>(
  endpoint: string | APIRequestConfig,
  validator?:
    | APICallHandler<{ data: T }>
    | AsyncAPICallHandler<{ data: T }>,
): Promise<T> {
  return (await apiCall<{ data: T }>(endpoint, validator)).data;
}

/*
 * The configuration object for a paginated API call
 */
export interface PaginatedAPIRequestConfig
  extends Omit<APIRequestConfig, "searchParams"> {
  searchParams?: Record<string, string | Array<string>> & { page?: string };
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
 * Merges consecutive pages of bulk summary results, concatenating the
 * `summaries` of any item whose rows were split across a page boundary.
 *
 * Rows are paginated by summary row (not by the summarized item), and ordered
 * by item id then timestamp - so an item with more rows than fit on one page
 * appears once at the end of a page (with a partial `summaries` array) and
 * again at the start of the next page (with the rest). This detects that
 * split - when the last item `id` on a page matches the first item `id` on
 * the next page - and merges them into a single entry with the combined
 * array.
 *
 * @param pages An ordered array of item pages, as returned by each page of a bulk summary endpoint
 *
 * @returns A flattened array of items, each with a complete `summaries` array
 */
export function mergeBulkPages<
  T extends { id: string; summaries: Array<unknown> },
>(
  pages: Array<Array<T>>,
): Array<T> {
  const merged: Array<T> = [];

  for (const page of pages) {
    for (const item of page) {
      const last = merged[merged.length - 1];

      if (last && last.id === item.id) {
        last.summaries = last.summaries.concat(item.summaries);
      } else {
        merged.push({ ...item, summaries: [...item.summaries] });
      }
    }
  }

  return merged;
}

/**
 * Fetches every page of a bulk summary endpoint, preserving the boundaries
 * between pages so they can be merged afterward.
 *
 * @param requestConfig The base request config (URL and search params) for the endpoint
 *
 * @returns An ordered array of pages, each an array of items
 */
export async function fetchAllBulkPages<T>(
  requestConfig: APIRequestConfig,
): Promise<Array<Array<T>>> {
  return await httpRequest<PaginatedResponse<T>>(
    requestConfig,
  ).then(async (response) => {
    const { data, has_next_page, page, pages } = response.body;
    const allPages: Array<Array<T>> = [];

    if (data.length) {
      allPages.push(data);

      if (has_next_page) {
        const rest = await Promise.all(
          Array.from(
            { length: pages - page },
            (_, idx) =>
              httpRequest<PaginatedResponse<T>>({
                ...requestConfig,
                searchParams: {
                  ...requestConfig.searchParams,
                  page: `${idx + 1 + page}`,
                },
              }).then((response) => response.body.data)
                .catch(genericAPIErrorHandler) as Promise<Array<T>>,
          ),
        );
        allPages.push(...rest);
      }
    }

    return allPages;
  }).catch(genericAPIErrorHandler) as Array<Array<T>>;
}

/**
 * Fetch all pages of a paginated endpoint, with the provided request callback.
 *
 * @param config An object containing the desired page number, and any other options for the provided request callback.
 *
 * @returns An array of the consolidated response items
 */
export async function paginatedApiCall<T>(
  endpoint: string | PaginatedAPIRequestConfig,
): Promise<Array<T>> {
  return await httpRequest<PaginatedResponse<T>>(endpoint)
    .then(async (response) => {
      const { data, has_next_page, page, pages } = response.body;
      const totalEntries: Array<T> = [];

      const requestConfig: APIRequestConfig = getRequestConfig(endpoint);

      if (data.length) {
        totalEntries.push(...data);

        if (has_next_page) {
          const items = await Promise.all(
            Array.from(
              { length: pages - page },
              (_, idx) =>
                httpRequest<PaginatedResponse<T>>(
                  {
                    ...requestConfig,
                    searchParams: {
                      ...requestConfig.searchParams,
                      page: `${idx + 1 + page}`,
                    },
                  },
                ).then((response) => response.body.data)
                  .catch(genericAPIErrorHandler) as Promise<Array<T>>,
            ),
          );
          totalEntries.push(...items.flat());
        }
      }

      return totalEntries;
    }).catch(genericAPIErrorHandler) as Array<T>;
}
