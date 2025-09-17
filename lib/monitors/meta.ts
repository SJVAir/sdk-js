import { jsonCall } from "$http";
import type { SJVAirMonitorsMeta } from "./types.ts";

/**
 * Fetches the metadata for monitors and monitor entries.
 *
 * @returns The metadata for monitors and monitor entries.
 */
export async function getMonitorsMeta(): Promise<SJVAirMonitorsMeta> {
  return await jsonCall<SJVAirMonitorsMeta>("monitors/meta");
}
