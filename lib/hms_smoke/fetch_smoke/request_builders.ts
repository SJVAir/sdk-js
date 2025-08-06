import { getApiUrl } from "$http";
import type { HMSSmokeRequestConfig } from "./types.ts";

/**
 * Constructs the URL for getting the "hms-smoke" api endpoint.
 *
 * @returns An instance of URL configured for the "monitors" api endpoint.
 */
export function getHMSSmokeUrl(config?: HMSSmokeRequestConfig): URL {
  const page = config?.page?.toString() ?? "1";

  return getApiUrl("hms-smoke", { page });
}
