import { getApiUrl } from "$http";

/**
 * Constructs the URL for getting the "calibrations" api endpoint.
 *
 * @returns An instance of URL configured for the "calibrations" api endpoint.
 */
export function getCollocationsUrl(): URL {
  return getApiUrl("calibrations");
}
