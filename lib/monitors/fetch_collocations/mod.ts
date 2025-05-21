import type { Collocation } from "../types.ts";
import { fetchCollocations } from "./requests.ts";
import { fetchCollocationsHandler } from "./response_handlers.ts";

/**
 * Fetches all collocations.
 *
 * @returns An array containing all collocations.
 */
export async function getCollocations(): Promise<Array<Collocation>> {
  return await fetchCollocations()
    .then(fetchCollocationsHandler);
}
