import { genericAPIErrorHandler } from "./error.ts";
import { getApiUrl } from "./origin.ts";

/*
 * The configuration object for an API call
 */
export interface APIRequestConfig {
  url: string;
  searchParams?: Record<string, string>;
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

type APICallValidator<T> = (response: APIRequestResponse<T>) => void;
type AsyncAPICallValidator<T> = (
  response: APIRequestResponse<T>,
) => Promise<void>;

/**
 * A helper for making generic api calls to SJVAir.
 *
 * @param url The URL of the endpoint.
 * @param validator The handler for the reqeust response.
 *
 * @returns The return value from the handler.
 */
export async function apiCall<T>(
  endpoint: string | APIRequestConfig,
  validator?: APICallValidator<T> | AsyncAPICallValidator<T>,
): Promise<Awaited<T>> {
  return await httpRequest<T>(endpoint).then(async (response) => {
    if (validator) {
      const result = validator(response);

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
    | APICallValidator<{ data: T }>
    | AsyncAPICallValidator<{ data: T }>,
): Promise<T> {
  return (await apiCall<{ data: T }>(endpoint, validator)).data;
}

/*
 * The configuration object for a paginated API call
 */
export interface PaginatedAPIRequestConfig
  extends Omit<APIRequestConfig, "searchParams"> {
  searchParams?: Record<string, string> & { page?: string };
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
