import { getApiUrl } from "$http";
import type { MonitorsLatestRequestConfig } from "./types.ts";

/**
 * A structure used for parsing MonitorsLatestRequestConfig
 */
class MonitorsLatestRequestOptions {
  [key: string]: string;

  /** The results page number to fetch */
  page: string;

  /**
   * Constructs a new MonitorsLatestRequestOptions object
   *
   * @param options A user defined MonitorsLatestRequestConfig object
   */
  constructor(options: MonitorsLatestRequestConfig) {
    this.page = options.page?.toString() ?? "1";
  }
}

/**
 * Constructs the URL for getting the "monitors" api endpoint.
 *
 * @returns An instance of URL configured for the "monitors" api endpoint.
 */
export function getMonitorsLatestUrl(
  config: MonitorsLatestRequestConfig,
): URL {
  const params = new MonitorsLatestRequestOptions(config);
  return getApiUrl(`monitors/${config.field}/current`, params);
}
