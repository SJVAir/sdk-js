/**
 * A utility for formatting dates for the SJVAir API.
 *
 * @example Usage
 * ```ts
 * import { apiDateFormat } from "@sjvair/sdk/datetime";
 *
 * const formattedDate = apiDateFormat(new Date());
 * console.log(formattedDate);
 * // Prints: "2025-09-25 10:44:38" (example output)
 * ```
 *
 * @module
 */

/**
 * Converts a Date object or string to the format used by the SJVAir API
 *
 * @param date A Date object or string;
 *
 * @returns A date string formatted as "YYYY-MM-DD HH:MM:SS"
 */
export function apiDateFormat(date: Date | number | string): string {
  date = (date instanceof Date) ? date : new Date(date);

  const year = date.getFullYear();

  if (isNaN(year)) {
    throw new Error("Invalid date provided");
  }

  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
