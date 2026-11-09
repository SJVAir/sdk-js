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
 * //         "mean_24h": 5.5,
 * //         "is_final": true,
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
import { fetchAllBulkPages, mergeBulkPages, type RequestOptions } from "$http";
import { mergeBulkOpenDays } from "../open_days.ts";
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
 * The configuration options for the bulk region open-days endpoint: the bulk
 * lists' region filter, without dates
 */
export type RegionSummaryBulkOpenRequestConfig = Omit<
  RegionSummaryBulkRequestConfig,
  "start" | "end"
>;

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
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkHourly(
  config: RegionSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/hourly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk daily region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkDaily(
  config: RegionSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/daily`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk monthly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkMonthly(
  config: RegionSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/monthly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk quarterly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkQuarterly(
  config: RegionSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/quarterly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk seasonal region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkSeasonal(
  config: RegionSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/seasonal`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk yearly region summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and region filter
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with their matching summaries
 */
export async function getRegionSummariesBulkYearly(
  config: RegionSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  return mergeRegionSummaryBulkPages(
    await fetchAllBulkPages<RegionWithSummaries>({
      url: `regions/${config.entryType}/summaries/yearly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches every page of bulk open-day region rows: daily rows for the days
 * that have no stored daily row yet, for each region given.
 *
 * Open days are today (Pacific), plus yesterday until its nightly row exists
 * (capped at about 03:00 Pacific). Today has no row until its first hour is
 * summarized (about 00:45). Open rows are built on request from the hours so
 * far, carry the same fields as stored daily rows, and always have
 * `is_final: false`. Responses are cached for 60 seconds
 * (`private, max-age=60`). Merge them into bulk daily results with
 * `mergeBulkOpenDays`, and read the result like this: `is_final: false` on
 * today means "so far", on an earlier day "not final yet"; a missing row
 * means "no data".
 *
 * The server pages these by owner (100 per page) and lists only owners with
 * an hourly row since the first open day, so an owner can have
 * `summaries: []`. Pages are fetched at once and each is built at its own
 * moment, so an owner can appear on two pages; it's kept once, with no
 * repeated day.
 *
 * @param config An object containing the entry type and region filter
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of regions, each with its open-day rows
 */
export async function getRegionSummariesBulkDailyOpen(
  config: RegionSummaryBulkOpenRequestConfig,
  options?: RequestOptions,
): Promise<Array<RegionWithSummaries>> {
  const pages = await fetchAllBulkPages<RegionWithSummaries>({
    url: `regions/${config.entryType}/summaries/daily/open`,
    searchParams: { region: config.region },
    options,
  });
  return mergeBulkOpenDays([], pages.flat());
}
