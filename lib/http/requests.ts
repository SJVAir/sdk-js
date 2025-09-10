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
  cb: (
    config: K,
  ) => Promise<PaginatedResponse<T>>,
): Promise<Array<T>> {
  const totalEntries: Array<T> = [];

  try {
    const { data, has_next_page, page: _page, pages } = await cb(config);

    if (data.length) {
      totalEntries.push(...data);

      if (has_next_page) {
        //Object.assign(config, { page: `${page + 1}` });
        //totalEntries.push(...(await consolidatePaginatedRequest(config, cb)));
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
