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
