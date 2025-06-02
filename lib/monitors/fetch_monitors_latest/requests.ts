import { DEFAULT_DISPLAY_FIELD } from "../constants.ts";
import type { MonitorLatest } from "../types.ts";
import { fetchMonitorsLatest } from "./fetchers.ts";
import { fetchMonitorsLatestHandler } from "./response_handlers.ts";

/**
 * Fetches all monitors.
 *
 * @returns An array containing all monitors.
 */
export async function getMonitorsLatest(): Promise<
  Array<MonitorLatest<typeof DEFAULT_DISPLAY_FIELD>>
> {
  return await fetchMonitorsLatest(DEFAULT_DISPLAY_FIELD)
    .then(fetchMonitorsLatestHandler);
}
