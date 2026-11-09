/**
 * Utilities for fetching aggregated monitor summaries in bulk, across all
 * monitors matching a date range and optional geographic filter.
 *
 * `start` and `end` are required; the server rejects an invalid or missing
 * date range (or an out-of-range `bbox`) with a 400, which surfaces as a
 * thrown error. The requested span is also capped per resolution by the
 * server (31 days for hourly, 366 days for daily; the coarser resolutions
 * aren't capped).
 *
 * @example Usage
 * ```ts
 * import { getMonitorSummariesBulkDaily } from "@sjvair/sdk/monitors/get_monitor_summaries_bulk";
 *
 * const monitors = await getMonitorSummariesBulkDaily({
 *   entryType: "pm25",
 *   start: "2024-01-01",
 *   end: "2024-01-31",
 *   region: "abc123",
 * });
 * console.log(monitors);
 * // Prints:
 * // [
 * //   {
 * //     "id": "xgXCRh68SdG5FOdbUXvR6Q",
 * //     "name": "UCM-aea0",
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
 * //   ... (more monitors)
 * // ]
 * ```
 *
 * @module
 */
import { fetchAllBulkPages, mergeBulkPages, type RequestOptions } from "$http";
import { mergeBulkOpenDays } from "../open_days.ts";
import type { MonitorEntryType, MonitorWithSummaries } from "./types.ts";

/**
 * The configuration options shared by all bulk monitor summary endpoints
 */
export interface MonitorSummaryBulkRequestConfig {
  /** The type of entry the summaries were aggregated from */
  entryType: MonitorEntryType;

  /** The (inclusive) start of the requested date range */
  start: Date | string;

  /** The (inclusive) end of the requested date range */
  end: Date | string;

  /** Restrict results to monitors within a `[west, south, east, north]` bounding box */
  bbox?: [west: number, south: number, east: number, north: number];

  /** Restrict results to monitors within one or more regions, by region sqid */
  region?: string | Array<string>;

  /**
   * The exact summary processor to return (an empty string selects raw) across
   * all monitors.
   *
   * @defaultValue Each monitor's published series - the same calibration the
   * map displays for that monitor type (e.g. EPA-calibrated PM2.5 for
   * PurpleAir, raw for reference monitors whose default processor isn't
   * summarized).
   */
  processor?: string;
}

/**
 * Formats a Date or string as the "YYYY-MM-DD" format expected by the bulk
 * monitor summary endpoints.
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
 * The configuration options for the bulk monitor open-days endpoint: the bulk
 * lists' scoping, without dates
 */
export type MonitorSummaryBulkOpenRequestConfig = Omit<
  MonitorSummaryBulkRequestConfig,
  "start" | "end"
>;

/**
 * Builds the scoping search params shared by the bulk monitor summary and
 * open-days endpoints.
 *
 * @param config An object containing the optional geographic filters and processor
 *
 * @returns A Record of search params
 */
function getBulkScopeSearchParams(
  config: MonitorSummaryBulkOpenRequestConfig,
): Record<string, string | Array<string>> {
  const searchParams: Record<string, string | Array<string>> = {};

  if (config.bbox) {
    searchParams.bbox = config.bbox.join(",");
  }

  if (config.region) {
    searchParams.region = config.region;
  }

  if (config.processor !== undefined) {
    searchParams.processor = config.processor;
  }

  return searchParams;
}

/**
 * Builds the search params shared by the bulk monitor summary endpoints.
 *
 * @param config An object containing the requested date range and optional geographic filters
 *
 * @returns A Record of search params for the bulk monitor summary endpoints
 */
function getBulkSummarySearchParams(
  config: MonitorSummaryBulkRequestConfig,
): Record<string, string | Array<string>> {
  return {
    start: toApiDate(config.start),
    end: toApiDate(config.end),
    ...getBulkScopeSearchParams(config),
  };
}

/**
 * Merges consecutive pages of bulk monitor summary results, concatenating the
 * `summaries` of any monitor whose rows were split across a page boundary.
 *
 * Rows are paginated by summary row (not by monitor), and ordered by monitor
 * id then timestamp - so a monitor with more rows than fit on one page appears
 * once at the end of a page (with a partial `summaries` array) and again at
 * the start of the next page (with the rest). This detects that split - when
 * the last monitor `id` on a page matches the first monitor `id` on the next
 * page - and merges them into a single entry with the combined array.
 *
 * @param pages An ordered array of monitor pages, as returned by each page of the bulk monitor summary endpoints
 *
 * @returns A flattened array of monitors, each with a complete `summaries` array
 */
export function mergeMonitorSummaryBulkPages(
  pages: Array<Array<MonitorWithSummaries>>,
): Array<MonitorWithSummaries> {
  return mergeBulkPages(pages);
}

/**
 * Fetches all pages of bulk hourly monitor summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and optional geographic filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with their matching summaries
 */
export async function getMonitorSummariesBulkHourly(
  config: MonitorSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  return mergeMonitorSummaryBulkPages(
    await fetchAllBulkPages<MonitorWithSummaries>({
      url: `monitors/${config.entryType}/summaries/hourly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk daily monitor summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and optional geographic filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with their matching summaries
 */
export async function getMonitorSummariesBulkDaily(
  config: MonitorSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  return mergeMonitorSummaryBulkPages(
    await fetchAllBulkPages<MonitorWithSummaries>({
      url: `monitors/${config.entryType}/summaries/daily`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk monthly monitor summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and optional geographic filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with their matching summaries
 */
export async function getMonitorSummariesBulkMonthly(
  config: MonitorSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  return mergeMonitorSummaryBulkPages(
    await fetchAllBulkPages<MonitorWithSummaries>({
      url: `monitors/${config.entryType}/summaries/monthly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk quarterly monitor summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and optional geographic filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with their matching summaries
 */
export async function getMonitorSummariesBulkQuarterly(
  config: MonitorSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  return mergeMonitorSummaryBulkPages(
    await fetchAllBulkPages<MonitorWithSummaries>({
      url: `monitors/${config.entryType}/summaries/quarterly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk seasonal monitor summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and optional geographic filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with their matching summaries
 */
export async function getMonitorSummariesBulkSeasonal(
  config: MonitorSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  return mergeMonitorSummaryBulkPages(
    await fetchAllBulkPages<MonitorWithSummaries>({
      url: `monitors/${config.entryType}/summaries/seasonal`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches all pages of bulk yearly monitor summaries, merged into a complete list.
 *
 * @param config An object containing the entry type, date range, and optional geographic filters
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with their matching summaries
 */
export async function getMonitorSummariesBulkYearly(
  config: MonitorSummaryBulkRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  return mergeMonitorSummaryBulkPages(
    await fetchAllBulkPages<MonitorWithSummaries>({
      url: `monitors/${config.entryType}/summaries/yearly`,
      searchParams: getBulkSummarySearchParams(config),
      options,
    }),
  );
}

/**
 * Fetches every page of bulk open-day monitor rows: daily rows for the days
 * that have no stored daily row yet, for every monitor in scope.
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
 * repeated day. When the owner set shrinks during the fetch (once a day, as
 * yesterday settles), a page past the new last page reads as empty and an
 * owner can be missed until the next request, a minute later at most.
 *
 * @param config An object containing the entry type and optional geographic filters and processor
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns An array of monitors, each with its open-day rows
 */
export async function getMonitorSummariesBulkDailyOpen(
  config: MonitorSummaryBulkOpenRequestConfig,
  options?: RequestOptions,
): Promise<Array<MonitorWithSummaries>> {
  const pages = await fetchAllBulkPages<MonitorWithSummaries>({
    url: `monitors/${config.entryType}/summaries/daily/open`,
    searchParams: getBulkScopeSearchParams(config),
    options,
  }, { laterPageMissingIsEmpty: true });
  return mergeBulkOpenDays([], pages.flat());
}
