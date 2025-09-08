import { getApiUrl } from "$http";

/**
 * Constructs the URL for getting the "login" api endpoint.
 *
 * @returns An instance of URL configured for the "monitors" api endpoint.
 */
export function getLoginUrl(): URL {
  return getApiUrl("account/login");
}
