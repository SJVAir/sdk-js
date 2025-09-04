import type { MonitorEntryType } from "../types.ts";

/**
 * The configuration options for the monitor entries endpoint
 */
export interface MonitorEntryCSVRequestConfig {
  /** Fields to include on the monitor entry */
  field: MonitorEntryType;

  /** The ID of the monitor for which entries will be fetched */
  monitorId: string;

  /**
   * The start time of the requested monitor sensor entry
   *
   * @defaultValue 3 days less than `MonitorEntryRequestResponse["timestampLte]`
   */
  timestampGte?: Date | number | string;

  /**
   * The end time of the requested monitor sensor entry
   *
   * @defaultValue The current date
   */
  timestampLte?: Date | number | string;
}
