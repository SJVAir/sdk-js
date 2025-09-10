import { paginatedApiCall } from "$http";
import type { Collocation } from "./types.ts";

/**
 * Fetches all collocations.
 *
 * @returns An array containing all collocations.
 */
export async function getCollocations(): Promise<Array<Collocation>> {
  return await paginatedApiCall<Collocation>("calibrations");
}
