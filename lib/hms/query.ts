/**
 * The date filters shared by the HMS smoke and fire lists.
 *
 * @example Usage
 * ```ts
 * import type { HMSDateQuery } from "@sjvair/sdk/hms/query";
 *
 * const september: HMSDateQuery = { start: "2025-09-01", end: "2025-09-30" };
 * ```
 *
 * @module
 */

/**
 * One day (`date`) or a range (`start`/`end`, either side optional, both ends
 * included). Dates are `YYYY-MM-DD` Pacific calendar days, as the server
 * stores them. With neither, the server returns today (or yesterday before
 * NOAA's first daily update).
 */
export type HMSDateQuery =
  | {
    /** One day, `YYYY-MM-DD` */
    date?: string;
    start?: never;
    end?: never;
  }
  | {
    date?: never;
    /** The first day of the range, `YYYY-MM-DD`, included */
    start?: string;
    /** The last day of the range, `YYYY-MM-DD`, included */
    end?: string;
  };

/** The filters both lists share: a day or range, and a region */
export type HMSBaseQuery = HMSDateQuery & {
  /** A region's id: records that touch the region */
  region_id?: string;
};
