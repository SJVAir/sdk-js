/**
 * A utility function for fetching monitors with a "latest" entry from the SJVAir API,
 * either as of now or as of a historical point in time.
 *
 * @example Usage
 * ```ts
 * import { getMonitors } from "@sjvair/sdk/monitors/get_monitors";
 *
 * const current = await getMonitors("pm25");
 * console.log(current);
 * // Prints:
 * //  [
 * //    {
 * //       "id": "s7lfa-o-R--FTQHb22lmuQ",
 * //       "name": "UCM-aea0",
 * //       "type": "purpleair",
 * //       "device": "PA-II",
 * //       "is_active": true,
 * //       "is_sjvair": true,
 * //       "position": {
 * //          "type": "Point",
 * //          "coordinates": [
 * //             -121.367,
 * //             37.98531
 * //          ]
 * //       },
 * //       ... (excerpted for brevity)
 * //     },
 * //     {
 * //        "id": "KnHBj1JvQYiSiwQk62zFuA",
 * //        "name": "ucm-af3e",
 * //        "type": "purpleair",
 * //        "device": "PA-II",
 * //        "is_active": true,
 * //        "is_sjvair": true,
 * //        "position": {
 * //            "type": "Point",
 * //            "coordinates": [
 * //                -120.4623,
 * //                37.33503
 * //            ]
 * //        },
 * //        ... (excerpted for brevity)
 * //     }
 * //     ... (more monitors)
 * //   ]
 *
 * const historical = await getMonitors("pm25", { timestamp: "2024-01-01T00:00:00Z" });
 * console.log(historical);
 * // Prints an array shaped the same as above, reflecting the monitors' data as of the given timestamp
 * ```
 *
 * @module
 */
import { jsonCall } from "$http";
import type { MonitorEntryType, MonitorLatestType } from "./types.ts";
import { apiDateFormat } from "$datetime";

/**
 * A bounding box, formatted as `[west, south, east, north]`
 */
export type MonitorBoundingBox = [
  west: number,
  south: number,
  east: number,
  north: number,
];

/**
 * The configuration options for fetching monitors as of a historical point in time
 */
export interface MonitorsAtOptions {
  /** The historical point in time to fetch monitor data as of */
  timestamp: Date | number | string;

  /** Scope results to one or more region ids */
  region?: string | Array<string>;

  /** Scope results to a bounding box */
  bbox?: MonitorBoundingBox;
}

/**
 * Fetches monitors with a "latest" entry, either as of now or as of a historical point in time.
 *
 * @param entryType The type of entry to include in the "latest" field
 * @param options When provided, fetches monitor data as of a historical `timestamp`, optionally
 * scoped to a `region` or `bbox`. When omitted, fetches monitor data as of now.
 *
 * @returns An array containing all monitors matching the given criteria, with a "latest" entry.
 */
export async function getMonitors<T extends MonitorEntryType>(
  entryType: T,
  options?: MonitorsAtOptions,
): Promise<Array<MonitorLatestType<T>>> {
  if (!options) {
    return await jsonCall<Array<MonitorLatestType<T>>>(
      `monitors/${entryType}/current`,
    );
  }

  const searchParams: Record<string, string | Array<string>> = {
    timestamp: apiDateFormat(options.timestamp),
  };

  if (options.region) {
    searchParams.region = Array.isArray(options.region)
      ? options.region
      : [options.region];
  }

  if (options.bbox) {
    searchParams.bbox = options.bbox.join(",");
  }

  return await jsonCall<Array<MonitorLatestType<T>>>({
    url: `monitors/${entryType}/at`,
    searchParams,
  });
}
