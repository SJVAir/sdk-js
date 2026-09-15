/**
 * A collection of utilities for exporting a monitor's entries over a date range.
 *
 * @example Usage
 * ```ts
 * import {
 *   getMonitorEntriesExportCSVUrl,
 *   getMonitorEntriesExportJSON,
 * } from "@sjvair/sdk/monitors/get_monitor_entries_export";
 *
 * const url = getMonitorEntriesExportCSVUrl({
 *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-02",
 * });
 * console.log(url);
 * // Prints (example output):
 * //  URL {
 * //    href: "https://www.sjvair.com/api/2.0/monitors/xgXCRh68SdG5FOdbUXvR6Q/entries/export/csv/?start_date=2024-01-01&end_date=2024-01-02",
 * //    ...
 * //  }
 *
 * const entries = await getMonitorEntriesExportJSON({
 *   monitorId: "xgXCRh68SdG5FOdbUXvR6Q",
 *   startDate: "2024-01-01",
 *   endDate: "2024-01-02",
 * });
 * console.log(entries);
 * // Prints:
 * // [
 * //   {
 * //     "timestamp": "2024-01-01T00:00:00-08:00",
 * //     "pm25": 6.7,
 * //     ... (other requested pollutant columns)
 * //   },
 * //   ... (more entries)
 * // ]
 * ```
 *
 * @module
 */
import { getApiUrl, jsonCall } from "$http";

/**
 * The scope of entries to export.
 *
 * `resolved` includes each pollutant's default stage and calibration.
 * `expanded` includes all stages and calibrations for each pollutant.
 */
export type MonitorEntryExportScope = "resolved" | "expanded";

/**
 * A single record of exported monitor entry data
 */
export interface MonitorEntryExportRecord {
  /** The timestamp the exported values were recorded at */
  timestamp: string;

  /** The exported value(s) for the requested pollutant(s), keyed by column name */
  [column: string]: string | number | null;
}

/**
 * The configuration options for the monitor entries export endpoints
 */
export interface MonitorEntryExportRequestConfig {
  /** The ID of the monitor for which entries will be exported */
  monitorId: string;

  /** The start of the requested date range, formatted as "YYYY-MM-DD" */
  startDate: string;

  /** The end of the requested date range, formatted as "YYYY-MM-DD" */
  endDate: string;

  /**
   * The scope of entries to export
   *
   * @defaultValue "resolved"
   */
  scope?: MonitorEntryExportScope;
}

/**
 * Builds the search params shared by the monitor entries export endpoints.
 *
 * @param config An object containing the requested date range and export scope
 *
 * @returns A Record of search params for the monitor entries export endpoints
 */
function getExportSearchParams(
  config: MonitorEntryExportRequestConfig,
): Record<string, string> {
  const searchParams: Record<string, string> = {
    start_date: config.startDate,
    end_date: config.endDate,
  };

  if (config.scope) {
    searchParams.scope = config.scope;
  }

  return searchParams;
}

/**
 * Constructs the URL for downloading a monitor's exported entries as a CSV.
 *
 * @param config An object containing the monitor ID, date range, and export scope
 *
 * @returns An instance of URL configured for the "monitors/{monitorId}/entries/export/csv" api endpoint.
 */
export function getMonitorEntriesExportCSVUrl(
  config: MonitorEntryExportRequestConfig,
): URL {
  return getApiUrl(
    `monitors/${config.monitorId}/entries/export/csv`,
    getExportSearchParams(config),
  );
}

/**
 * Fetches a monitor's exported entries as JSON, for a given date range.
 *
 * @param config An object containing the monitor ID, date range, and export scope
 *
 * @returns An array of exported monitor entry records
 */
export async function getMonitorEntriesExportJSON(
  config: MonitorEntryExportRequestConfig,
): Promise<Array<MonitorEntryExportRecord>> {
  return await jsonCall<Array<MonitorEntryExportRecord>>({
    url: `monitors/${config.monitorId}/entries/export/json`,
    searchParams: getExportSearchParams(config),
  });
}
