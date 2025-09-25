/**
 * Ensures a timestamp is prior to the current moment and represented by a Date object.
 *
 * @param timestamp The timestamp to validate.
 *
 * @returns A valid Date object.
 */
function getValidDate(timestamp: Date | string | number): Date {
  if (!(timestamp instanceof Date)) {
    timestamp = new Date(timestamp);
  }

  if (isNaN(timestamp as unknown as number)) {
    throw new Error(
      `Provided timestamp "${timestamp}" cannot be used to construct a valid Date`,
    );
  } else if (timestamp > new Date()) {
    throw new Error(`Provided timestamp "${timestamp}" is greater than now`);
  }

  return timestamp;
}

/**
 * Derives the GTE timestamp from the provided LTE timestamp.
 *
 * @param timestampLte A valid Date object.
 *
 * @returns A Date object set 3 days prior to the given timestampLte.
 */
function deriveTimestampGte(timestampLte: Date) {
  const timestampGte = new Date(timestampLte);
  timestampGte.setDate(timestampLte.getDate() - 3);
  timestampGte.setHours(0, 0, 0, 0);

  return timestampGte;
}

/**
 * The data structure returned by getValidDateRange.
 */
type DateRange = { gte: Date; lte: Date };
/**
 * Get a valid date range from the provided timestamps, if any.
 *
 * @param timestampGte The beginning timestamp of the date range
 * @param timestampLte The ending timestamp of the date range
 *
 * @returns A DateRange object ready to be consumed by the SJVAir
 */
export function getValidDateRange(
  timestampGte?: Date | string | number,
  timestampLte?: Date | string | number,
): DateRange {
  const gteDefined = timestampGte !== undefined;
  const lteDefined = timestampLte !== undefined;

  if (!gteDefined && !lteDefined) {
    timestampLte = new Date();
    timestampLte.setHours(23, 59, 59, 999);

    timestampGte = deriveTimestampGte(timestampLte);
  } else if (gteDefined && !lteDefined) {
    timestampGte = getValidDate(timestampGte!);

    timestampLte = new Date(timestampGte);
    timestampLte.setDate(timestampGte.getDate() + 3);
    timestampLte.setHours(23, 59, 59, 999);
  } else if (!gteDefined && lteDefined) {
    timestampLte = getValidDate(timestampLte!);
    timestampGte = deriveTimestampGte(timestampLte);
  } else {
    timestampGte = getValidDate(timestampGte!);
    timestampLte = getValidDate(timestampLte!);
  }

  return { gte: timestampGte, lte: timestampLte } as DateRange;
}
