/**
 * A collection of utilities for fetching aggregated summaries of a monitor's entries.
 *
 * @example Usage
 * ```ts
 * import { getMonitorSummariesDaily } from "@sjvair/sdk/monitors/get_monitor_summaries";
 *
 * const summaries = await getMonitorSummariesDaily({
 *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
 *   entryType: "pm25",
 *   year: 2024,
 * });
 * console.log(summaries);
 * // Prints:
 * // [
 * //   {
 * //     "timestamp": "2024-01-01T00:00:00-08:00",
 * //     "entry_type": "pm25",
 * //     "resolution": "day",
 * //     "processor": "",
 * //     "count": 288,
 * //     "expected_count": 288,
 * //     "minimum": 2.1,
 * //     "maximum": 9.4,
 * //     "mean": 5.6,
 * //     "stddev": 1.2,
 * //     "p25": 4.5,
 * //     "p75": 6.7,
 * //     "is_complete": true
 * //   },
 * //   ... (more summaries)
 * // ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { MonitorEntryType, MonitorSummary } from "./types.ts";

/**
 * The base configuration options shared by all monitor summary endpoints
 */
export interface MonitorSummaryRequestConfig {
  /** The ID of the monitor for which summaries will be fetched */
  monitorId: string;

  /** The type of entry the summaries were aggregated from */
  entryType: MonitorEntryType;

  /** Restrict results to summaries derived from a specific processor */
  processor?: string;

  /** The results page number to fetch */
  page?: number;
}

/**
 * The configuration options for the hourly monitor summary endpoints
 */
export interface MonitorSummaryHourlyRequestConfig
  extends MonitorSummaryRequestConfig {
  /** The year to fetch hourly summaries for */
  year: number;

  /** The month to fetch hourly summaries for */
  month?: number;

  /** The day to fetch hourly summaries for */
  day?: number;
}

/**
 * The configuration options for the daily monitor summary endpoints
 */
export interface MonitorSummaryDailyRequestConfig
  extends MonitorSummaryRequestConfig {
  /** The year to fetch daily summaries for */
  year: number;

  /** The month to fetch daily summaries for */
  month?: number;
}

/**
 * The configuration options for the monthly, quarterly, and seasonal monitor summary endpoints
 */
export interface MonitorSummaryYearRequestConfig
  extends MonitorSummaryRequestConfig {
  /** The year to fetch summaries for */
  year: number;
}

/**
 * Builds the search params shared by the monitor summary endpoints.
 *
 * @param config An object containing the results page number and processor filter
 *
 * @returns A Record of search params for the monitor summary endpoints
 */
function getSummarySearchParams(
  config: MonitorSummaryRequestConfig,
): Record<string, string> {
  const searchParams: Record<string, string> = {
    page: (config.page ?? 1).toString(),
  };

  if (config.processor) {
    searchParams.processor = config.processor;
  }

  return searchParams;
}

/**
 * Fetches all pages of hourly summaries for a given monitor.
 *
 * @param config An object containing the monitor ID, entry type, and optional year/month/day
 *
 * @returns An array of monitor summaries
 */
export async function getMonitorSummariesHourly(
  config: MonitorSummaryHourlyRequestConfig,
): Promise<Array<MonitorSummary>> {
  const segments = [config.year, config.month, config.day].filter(
    (segment) => segment !== undefined,
  );

  return await paginatedApiCall<MonitorSummary>({
    url: `monitors/${config.monitorId}/summaries/${config.entryType}/hourly/${
      segments.join("/")
    }`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of daily summaries for a given monitor.
 *
 * @param config An object containing the monitor ID, entry type, and optional year/month
 *
 * @returns An array of monitor summaries
 */
export async function getMonitorSummariesDaily(
  config: MonitorSummaryDailyRequestConfig,
): Promise<Array<MonitorSummary>> {
  const segments = [config.year, config.month].filter(
    (segment) => segment !== undefined,
  );

  return await paginatedApiCall<MonitorSummary>({
    url: `monitors/${config.monitorId}/summaries/${config.entryType}/daily/${
      segments.join("/")
    }`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of monthly summaries for a given monitor.
 *
 * @param config An object containing the monitor ID, entry type, and year
 *
 * @returns An array of monitor summaries
 */
export async function getMonitorSummariesMonthly(
  config: MonitorSummaryYearRequestConfig,
): Promise<Array<MonitorSummary>> {
  return await paginatedApiCall<MonitorSummary>({
    url:
      `monitors/${config.monitorId}/summaries/${config.entryType}/monthly/${config.year}`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of quarterly summaries for a given monitor.
 *
 * @param config An object containing the monitor ID, entry type, and year
 *
 * @returns An array of monitor summaries
 */
export async function getMonitorSummariesQuarterly(
  config: MonitorSummaryYearRequestConfig,
): Promise<Array<MonitorSummary>> {
  return await paginatedApiCall<MonitorSummary>({
    url:
      `monitors/${config.monitorId}/summaries/${config.entryType}/quarterly/${config.year}`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of seasonal summaries for a given monitor.
 *
 * @param config An object containing the monitor ID, entry type, and year
 *
 * @returns An array of monitor summaries
 */
export async function getMonitorSummariesSeasonal(
  config: MonitorSummaryYearRequestConfig,
): Promise<Array<MonitorSummary>> {
  return await paginatedApiCall<MonitorSummary>({
    url:
      `monitors/${config.monitorId}/summaries/${config.entryType}/seasonal/${config.year}`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of yearly summaries for a given monitor.
 *
 * @param config An object containing the monitor ID and entry type
 *
 * @returns An array of monitor summaries
 */
export async function getMonitorSummariesYearly(
  config: MonitorSummaryRequestConfig,
): Promise<Array<MonitorSummary>> {
  return await paginatedApiCall<MonitorSummary>({
    url: `monitors/${config.monitorId}/summaries/${config.entryType}/yearly`,
    searchParams: getSummarySearchParams(config),
  });
}
