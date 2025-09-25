/**
 * Datetime Utilities
 *
 * @example Usage
 * ```ts
 * import { apiDateFormat, getValidDateRange } from "@sjvair/sdk/datetime";
 *
 * const formattedDate = apiDateFormat(new Date());
 * console.log(formattedDate);
 * // Prints: "2025-09-25 10:44:38" (example output)
 *
 * const dateRange = getValidDateRange("2023-01-01", "2023-12-31");
 * console.log(dateRange);
 * // Prints: { gte: 2023-01-01T00:00:00.000Z, lte: 2023-12-31T00:00:00.000Z }
 *
 * const otherDateRange = getValidDateRange(new Date(), new Date());
 * console.log(otherDateRange);
 * // Prints: { gte: 2025-09-25T07:00:00.000Z, lte: 2025-09-26T06:59:59.999Z } (example output)
 *
 * const yetAnother = getValidDateRange("03-17-1994");
 * console.log(yetAnother);
 * // Prints: { gte: 1994-03-17T08:00:00.000Z, lte: 1994-03-21T07:59:59.999Z }
 *
 * const lastThreeDays = getValidDateRange();
 * console.log(lastThreeDays);
 * // Prints: { gte: 2025-09-22T07:00:00.000Z, lte: 2025-09-25T06:59:59.999Z } (example output)
 * ```
 *
 * @module
 */
export { apiDateFormat } from "./api_date_format.ts";
export { getValidDateRange } from "./get_valid_date_range.ts";
