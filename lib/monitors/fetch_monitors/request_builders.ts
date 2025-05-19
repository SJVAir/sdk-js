import { getApiUrl } from "$http";

/**
 * Constructs the URL for getting the "monitors" api endpoint.
 *
 * @returns An instance of URL configured for the "monitors" api endpoint.
 */
export function getMonitorsUrl(): URL {
  return getApiUrl("monitors");
}
