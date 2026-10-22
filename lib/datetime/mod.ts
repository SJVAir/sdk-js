/**
 * Datetime Utilities
 *
 * @example Usage
 * ```ts
 * import {
 *   endOfPacificDay,
 *   getValidDateRange,
 *   startOfPacificDay,
 *   toApiTimestamp,
 * } from "@sjvair/sdk/datetime";
 *
 * console.log(toApiTimestamp(new Date("2026-10-22T00:00:00-07:00")));
 * // Prints: "2026-10-22T07:00:00.000Z"
 *
 * const now = new Date("2026-10-22T12:00:00Z");
 * console.log(startOfPacificDay(now).toISOString(), endOfPacificDay(now).toISOString());
 * // Prints: "2026-10-22T07:00:00.000Z 2026-10-23T06:59:59.999Z"
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
 * // Prints: { gte: 2025-09-21T07:00:00.000Z, lte: 2025-09-25T06:59:59.999Z } (example output)
 * ```
 *
 * @module
 */
export { apiDateFormat } from "./api_date_format.ts";
export { getValidDateRange } from "./get_valid_date_range.ts";
export {
  addPacificDays,
  endOfPacificDay,
  startOfPacificDay,
} from "./pacific.ts";
export { toApiTimestamp } from "./to_api_timestamp.ts";
