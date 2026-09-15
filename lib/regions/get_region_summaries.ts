/**
 * A collection of utilities for fetching aggregated summaries of a region's entries.
 *
 * @example Usage
 * ```ts
 * import { getRegionSummariesDaily } from "@sjvair/sdk/regions/get_region_summaries";
 *
 * const summaries = await getRegionSummariesDaily({
 *   regionId: "5nO2A8",
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
 * //     "count": 288,
 * //     "expected_count": 288,
 * //     "minimum": 2.1,
 * //     "maximum": 9.4,
 * //     "mean": 5.6,
 * //     "stddev": 1.2,
 * //     "p25": 4.5,
 * //     "p75": 6.7,
 * //     "station_count": 12
 * //   },
 * //   ... (more summaries)
 * // ]
 * ```
 *
 * @module
 */
import { paginatedApiCall } from "$http";
import type { MonitorEntryType } from "../monitors/types.ts";
import type { RegionSummary } from "./types.ts";

/**
 * The base configuration options shared by all region summary endpoints
 */
export interface RegionSummaryRequestConfig {
  /** The ID of the region for which summaries will be fetched */
  regionId: string;

  /** The type of entry the summaries were aggregated from */
  entryType: MonitorEntryType;

  /** The results page number to fetch */
  page?: number;
}

/**
 * The configuration options for the hourly region summary endpoints
 */
export interface RegionSummaryHourlyRequestConfig
  extends RegionSummaryRequestConfig {
  /** The year to fetch hourly summaries for */
  year: number;

  /** The month to fetch hourly summaries for */
  month?: number;

  /** The day to fetch hourly summaries for */
  day?: number;
}

/**
 * The configuration options for the daily region summary endpoints
 */
export interface RegionSummaryDailyRequestConfig
  extends RegionSummaryRequestConfig {
  /** The year to fetch daily summaries for */
  year: number;

  /** The month to fetch daily summaries for */
  month?: number;
}

/**
 * The configuration options for the monthly, quarterly, and seasonal region summary endpoints
 */
export interface RegionSummaryYearRequestConfig
  extends RegionSummaryRequestConfig {
  /** The year to fetch summaries for */
  year: number;
}

/**
 * Builds the search params shared by the region summary endpoints.
 *
 * @param config An object containing the results page number
 *
 * @returns A Record of search params for the region summary endpoints
 */
function getSummarySearchParams(
  config: RegionSummaryRequestConfig,
): Record<string, string> {
  return {
    page: (config.page ?? 1).toString(),
  };
}

/**
 * Fetches all pages of hourly summaries for a given region.
 *
 * @param config An object containing the region ID, entry type, and optional year/month/day
 *
 * @returns An array of region summaries
 */
export async function getRegionSummariesHourly(
  config: RegionSummaryHourlyRequestConfig,
): Promise<Array<RegionSummary>> {
  const segments = [config.year, config.month, config.day].filter(
    (segment) => segment !== undefined,
  );

  return await paginatedApiCall<RegionSummary>({
    url: `regions/${config.regionId}/summaries/${config.entryType}/hourly/${
      segments.join("/")
    }`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of daily summaries for a given region.
 *
 * @param config An object containing the region ID, entry type, and optional year/month
 *
 * @returns An array of region summaries
 */
export async function getRegionSummariesDaily(
  config: RegionSummaryDailyRequestConfig,
): Promise<Array<RegionSummary>> {
  const segments = [config.year, config.month].filter(
    (segment) => segment !== undefined,
  );

  return await paginatedApiCall<RegionSummary>({
    url: `regions/${config.regionId}/summaries/${config.entryType}/daily/${
      segments.join("/")
    }`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of monthly summaries for a given region.
 *
 * @param config An object containing the region ID, entry type, and year
 *
 * @returns An array of region summaries
 */
export async function getRegionSummariesMonthly(
  config: RegionSummaryYearRequestConfig,
): Promise<Array<RegionSummary>> {
  return await paginatedApiCall<RegionSummary>({
    url:
      `regions/${config.regionId}/summaries/${config.entryType}/monthly/${config.year}`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of quarterly summaries for a given region.
 *
 * @param config An object containing the region ID, entry type, and year
 *
 * @returns An array of region summaries
 */
export async function getRegionSummariesQuarterly(
  config: RegionSummaryYearRequestConfig,
): Promise<Array<RegionSummary>> {
  return await paginatedApiCall<RegionSummary>({
    url:
      `regions/${config.regionId}/summaries/${config.entryType}/quarterly/${config.year}`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of seasonal summaries for a given region.
 *
 * @param config An object containing the region ID, entry type, and year
 *
 * @returns An array of region summaries
 */
export async function getRegionSummariesSeasonal(
  config: RegionSummaryYearRequestConfig,
): Promise<Array<RegionSummary>> {
  return await paginatedApiCall<RegionSummary>({
    url:
      `regions/${config.regionId}/summaries/${config.entryType}/seasonal/${config.year}`,
    searchParams: getSummarySearchParams(config),
  });
}

/**
 * Fetches all pages of yearly summaries for a given region.
 *
 * @param config An object containing the region ID and entry type
 *
 * @returns An array of region summaries
 */
export async function getRegionSummariesYearly(
  config: RegionSummaryRequestConfig,
): Promise<Array<RegionSummary>> {
  return await paginatedApiCall<RegionSummary>({
    url: `regions/${config.regionId}/summaries/${config.entryType}/yearly`,
    searchParams: getSummarySearchParams(config),
  });
}
