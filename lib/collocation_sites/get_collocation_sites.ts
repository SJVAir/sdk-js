import { paginatedApiCall } from "$http";
import type { CollocationSite } from "./types.ts";

/**
 * Fetches all collocation sites.
 *
 * @returns An array containing all collocation sites.
 */
export async function getCollocationSites(): Promise<Array<CollocationSite>> {
  return await paginatedApiCall<CollocationSite>("calibrations");
}
