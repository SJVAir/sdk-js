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
