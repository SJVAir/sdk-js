/**
 * A utility function for fetching ongoing HMS Smoke events from the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { getHMSSmoke } from "@sjvair/sdk/hms/smoke/get_smoke";
 *
 * // Today's (or yesterday's, before NOAA's first daily update)
 * const ongoingSmoke = await getHMSSmoke();
 *
 * // One day, or a range (both ends included)
 * const day = await getHMSSmoke({ date: "2025-09-07" });
 * const september = await getHMSSmoke({ start: "2025-09-01", end: "2025-09-30" });
 * console.log(ongoingSmoke);
 * // Prints:
 * //  [
 * //    {
 * //      id: "MZWcmY0fTI2h_YlwS9PfWQ",
 * //      satellite: "GOES-WEST",
 * //      density: "heavy",
 * //      end: "2025-09-07T14:30:00Z",
 * //      start: "2025-09-07T12:00:00Z",
 * //      date: "2025-09-07",
 * //      geometry: { type: "MultiPolygon", coordinates: [ [ [Array] ] ] },
 * //      is_final: true
 * //    },
 * //    ...
 * //  ]
 * ```
 *
 * @module
 */
import { paginatedApiCall, type RequestOptions } from "$http";
import { hmsSearchParams } from "../query.ts";
import type { HMSSmokeGeoJSON, HMSSmokeQuery } from "./types.ts";

/**
 * Fetch all pages of ongoing HMS Smoke geojson, using native fetch api
 *
 * @param query A day (`date`) or range (`start`/`end`, `YYYY-MM-DD` Pacific
 * days, both ends included), and other filters. Without a day or range, the
 * server returns today's.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of geojson objects
 */
export async function getHMSSmoke(
  query?: HMSSmokeQuery,
  options?: RequestOptions,
): Promise<Array<HMSSmokeGeoJSON>> {
  return await paginatedApiCall<HMSSmokeGeoJSON>({
    url: "hms/smoke",
    searchParams: hmsSearchParams(query),
    options,
  });
}
