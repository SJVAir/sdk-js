/**
 * A utility for generating valid date ranges. Days are snapped in Pacific time
 * (`America/Los_Angeles`), whatever the device's zone.
 *
 * Bounds you give are returned as given (only ordered). Missing bounds default
 * to whole Pacific days. Pass `{ wholeDays: true }` to round the range out to
 * whole Pacific days: the start to the start of its day, the end to the end of
 * its day. A string without a zone is parsed in the device's zone, so pass a
 * Date or an ISO string with an offset to be unambiguous.
 *
 * @example Usage
 * ```ts
 * import { getValidDateRange } from "@sjvair/sdk/datetime";
 *
 * const dateRange = getValidDateRange("2023-01-01", "2023-12-31");
 * console.log(dateRange);
 * // Prints: { gte: 2023-01-01T00:00:00.000Z, lte: 2023-12-31T00:00:00.000Z }
 *
 * // A short window is kept as given.
 * const lastTwoMinutes = getValidDateRange(
 *   "2025-09-25T18:00:00Z",
 *   "2025-09-25T18:02:00Z",
 * );
 * console.log(lastTwoMinutes);
 * // Prints: { gte: 2025-09-25T18:00:00.000Z, lte: 2025-09-25T18:02:00.000Z }
 *
 * // Round out to whole Pacific days.
 * const today = getValidDateRange(new Date(), new Date(), { wholeDays: true });
 * console.log(today);
 * // Prints: { gte: 2025-09-25T07:00:00.000Z, lte: 2025-09-26T06:59:59.999Z } (example output)
 *
 * const lastThreeDays = getValidDateRange();
 * console.log(lastThreeDays);
 * // Prints: { gte: 2025-09-21T07:00:00.000Z, lte: 2025-09-25T06:59:59.999Z } (example output)
 * ```
 *
 * @module
 */

import {
  addPacificDays,
  endOfPacificDay,
  startOfPacificDay,
} from "./pacific.ts";

/**
 * Ensures a timestamp is represented by a valid Date object. Bounds later than
 * now are allowed (e.g. the end of today).
 *
 * @param timestamp The timestamp to validate.
 *
 * @returns A new, valid Date object.
 */
function getValidDate(timestamp: Date | string | number): Date {
  const date = new Date(
    timestamp instanceof Date ? timestamp.getTime() : timestamp,
  );

  if (isNaN(date.getTime())) {
    throw new Error(
      `Provided timestamp "${timestamp}" cannot be used to construct a valid Date`,
    );
  }

  return date;
}

/**
 * Orders two dates, then rounds them out to whole Pacific days if
 * `wholeDays` is set.
 *
 * @param timestampGte The first date.
 * @param timestampLte The second date.
 * @param wholeDays When true, snap the earlier date to the start of its
 * Pacific day and the later one to the end of its Pacific day.
 *
 * @returns The ordered range.
 */
function ensureValidRange(
  timestampGte: Date | string | number,
  timestampLte: Date | string | number,
  wholeDays: boolean,
): DateRange {
  const [earlier, later] = [
    getValidDate(timestampGte),
    getValidDate(timestampLte),
  ]
    .sort((a, b) => a.getTime() - b.getTime());

  if (wholeDays) {
    return { gte: startOfPacificDay(earlier), lte: endOfPacificDay(later) };
  }

  return { gte: earlier, lte: later };
}

/**
 * Derives the GTE timestamp from the provided LTE timestamp.
 *
 * @param timestampLte A valid Date object.
 *
 * @returns The start of the Pacific day 3 days prior to the given timestampLte.
 */
function deriveTimestampGte(timestampLte: Date): Date {
  return startOfPacificDay(addPacificDays(timestampLte, -3));
}

/**
 * The data structure returned by getValidDateRange.
 */
type DateRange = { gte: Date; lte: Date };

/**
 * Options for getValidDateRange.
 */
export interface ValidDateRangeOptions {
  /**
   * Round the range out to whole Pacific days: the start to the start of its
   * day, the end to the end of its day, for any span. Without it, given bounds
   * are returned as given.
   *
   * @defaultValue false
   */
  wholeDays?: boolean;
}

/**
 * Get a valid date range from the provided timestamps, if any. Days are
 * Pacific (`America/Los_Angeles`) calendar days, whatever the device's zone.
 *
 * - Neither bound: the start of the Pacific day 3 days ago to the end of today.
 * - Only `timestampGte`: from it to the end of the Pacific day 3 days later.
 * - Only `timestampLte`: from the start of the Pacific day 3 days earlier to it.
 * - Both: ordered and returned as given, however close together.
 *
 * With `options.wholeDays`, a given start moves back to the start of its
 * Pacific day and a given end moves forward to the end of its Pacific day.
 *
 * Bounds later than now are allowed. Date arguments are never mutated.
 *
 * @param timestampGte The beginning timestamp of the date range
 * @param timestampLte The ending timestamp of the date range
 * @param options Optional settings; `wholeDays` rounds to whole Pacific days
 *
 * @example Whole Pacific days
 * ```ts
 * const { gte, lte } = getValidDateRange(
 *   "2026-11-02T17:00:00Z", // 9:00 Monday, Pacific
 *   "2026-11-04T11:00:00Z", // 3:00 Wednesday, Pacific
 *   { wholeDays: true },
 * );
 * // gte: 2026-11-02T08:00:00.000Z (midnight Monday)
 * // lte: 2026-11-05T07:59:59.999Z (end of Wednesday)
 * ```
 *
 * @returns A DateRange object ready to be consumed by the SJVAir
 */
export function getValidDateRange(
  timestampGte?: Date | string | number,
  timestampLte?: Date | string | number,
  options?: ValidDateRangeOptions,
): DateRange {
  const wholeDays = options?.wholeDays === true;

  if (timestampGte !== undefined && timestampLte !== undefined) {
    return ensureValidRange(timestampGte, timestampLte, wholeDays);
  }

  if (timestampGte !== undefined) {
    const gte = getValidDate(timestampGte);
    return {
      gte: wholeDays ? startOfPacificDay(gte) : gte,
      lte: endOfPacificDay(addPacificDays(gte, 3)),
    };
  }

  if (timestampLte !== undefined) {
    const lte = getValidDate(timestampLte);
    return {
      gte: deriveTimestampGte(lte),
      lte: wholeDays ? endOfPacificDay(lte) : lte,
    };
  }

  const lte = endOfPacificDay(new Date());
  return { gte: deriveTimestampGte(lte), lte };
}
