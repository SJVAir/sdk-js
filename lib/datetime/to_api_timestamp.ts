/**
 * A utility for formatting timestamps sent to the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { toApiTimestamp } from "@sjvair/sdk/datetime/to_api_timestamp";
 *
 * console.log(toApiTimestamp(new Date("2026-10-22T00:00:00-07:00")));
 * // Prints: "2026-10-22T07:00:00.000Z"
 * ```
 *
 * @module
 */

/**
 * Formats a timestamp as a UTC ISO 8601 string with a `Z` suffix, which the
 * API reads as an exact instant whatever the device's time zone. (The API reads
 * a zone-less timestamp as Pacific time, and one in the repeated hour on
 * fall-back night is ambiguous.)
 *
 * @param date A Date object, epoch milliseconds, or a string `Date` can parse.
 *
 * @returns The timestamp formatted as "YYYY-MM-DDTHH:MM:SS.sssZ".
 */
export function toApiTimestamp(date: Date | number | string): string {
  const parsed = (date instanceof Date) ? date : new Date(date);

  if (isNaN(parsed.getTime())) {
    throw new Error("Invalid date provided");
  }

  return parsed.toISOString();
}
