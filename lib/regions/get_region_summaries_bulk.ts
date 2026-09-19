/**
 * Utilities for fetching aggregated region summaries in bulk, across all
 * regions matching a date range and region filter.
 *
 * `start`, `end`, and `region` are all required; the server rejects an
 * invalid or missing date range, or a missing `region` filter, with a 400,
 * which surfaces as a thrown error.
 *
 * @example Usage
 * ```ts
 * import { getRegionSummariesBulkDaily } from "@sjvair/sdk/regions/get_region_summaries_bulk";
 *
 * const regions = await getRegionSummariesBulkDaily({
 *   entryType: "pm25",
 *   start: "2024-01-01",
 *   end: "2024-01-31",
 *   region: "abc123",
 * });
 * console.log(regions);
 * // Prints:
 * // [
 * //   {
 * //     "id": "5nO2A8",
 * //     "name": "Fresno County",
 * //     ... (excerpted for brevity)
 * //     "summaries": [
 * //       {
 * //         "timestamp": "2024-01-01T00:00:00-08:00",
 * //         "entry_type": "pm25",
 * //         "resolution": "day",
 * //         ... (excerpted for brevity)
 * //       },
 * //       ... (more summaries)
 * //     ]
 * //   },
 * //   ... (more regions)
 * // ]
 * ```
 *
 * @module
 */
import { fetchAllBulkPages, mergeBulkPages } from "$http";
import type { RegionWithSummaries } from "./types.ts";

/**
 * The configuration options shared by all bulk region summary endpoints
 */
export interface RegionSummaryBulkRequestConfig {
  /** The type of entry the summaries were aggregated from */
  entryType: string;

  /** The (inclusive) start of the requested date range */
  start: Date | string;

  /** The (inclusive) end of the requested date range */
  end: Date | string;

  /** Restrict results to one or more regions, by region sqid */
  region: string | Array<string>;
}

/**
 * Formats a Date or string as the "YYYY-MM-DD" format expected by the bulk
 * region summary endpoints.
 *
 * @param date A Date object or a date string
 *
 * @returns A date string formatted as "YYYY-MM-DD"
 */
function toApiDate(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }

  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Builds the search params shared by the bulk region summary endpoints.
 *
 * @param config An object containing the requested date range and region filter
 *
 * @returns A Record of search params for the bulk region summary endpoints
 */
function getBulkSummarySearchParams(
  config: RegionSummaryBulkRequestConfig,
): Record<string, string | Array<string>> {
  return {
    start: toApiDate(config.start),
    end: toApiDate(config.end),
    region: config.region,
  };
}

/**
 * Merges consecutive pages of bulk region summary results, concatenating the
 * `summaries` of any region whose rows were split across a page boundary.
 *
 * Rows are paginated by summary row (not by region), and ordered by region id
 * then timestamp - so a region with more rows than fit on one page appears
 * once at the end of a page (with a partial `summaries` array) and again at
 * the start of the next page (with the rest). This detects that split - when
 * the last region `id` on a page matches the first region `id` on the next
 * page - and merges them into a single entry with the combined array.
 *
 * @param pages An ordered array of region pages, as returned by each page of the bulk region summary endpoints
 *
 * @returns A flattened array of regions, each with a complete `summaries` array
 */
export function mergeRegionSummaryBulkPages(
  pages: Array<Array<RegionWithSummaries>>,
): Array<RegionWithSummaries> {
  return mergeBulkPages(pages);
}

/**
 * Fetches all pages of bulk hourly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkHourly(
  config: RegionSummaryBulkRequestConfig,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/hourly`,
      searchParams: getBulkSummarySearchParams(config),
    }),
  );
}

/**
 * Fetches all pages of bulk daily region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkDaily(
  config: RegionSummaryBulkRequestConfig,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/daily`,
      searchParams: getBulkSummarySearchParams(config),
    }),
  );
}

/**
 * Fetches all pages of bulk monthly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkMonthly(
  config: RegionSummaryBulkRequestConfig,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/monthly`,
      searchParams: getBulkSummarySearchParams(config),
    }),
  );
}

/**
 * Fetches all pages of bulk quarterly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkQuarterly(
  config: RegionSummaryBulkRequestConfig,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/quarterly`,
      searchParams: getBulkSummarySearchParams(config),
    }),
  );
}

/**
 * Fetches all pages of bulk seasonal region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkSeasonal(
  config: RegionSummaryBulkRequestConfig,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/seasonal`,
      searchParams: getBulkSummarySearchParams(config),
    }),
  );
}

/**
 * Fetches all pages of bulk yearly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkYearly(
  config: RegionSummaryBulkRequestConfig,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/yearly`,
      searchParams: getBulkSummarySearchParams(config),
    }),
  );
}
