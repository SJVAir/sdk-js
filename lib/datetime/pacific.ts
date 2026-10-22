/**
 * Utilities for snapping and stepping dates by Pacific calendar day
 * (`America/Los_Angeles`), the zone SJVAir's days are defined in, whatever
 * zone the device running the SDK is in. DST-correct.
 *
 * @example Usage
 * ```ts
 * import {
 *   addPacificDays,
 *   endOfPacificDay,
 *   startOfPacificDay,
 * } from "@sjvair/sdk/datetime/pacific";
 *
 * const now = new Date("2026-10-22T12:00:00Z");
 *
 * console.log(startOfPacificDay(now).toISOString());
 * // Prints: "2026-10-22T07:00:00.000Z"
 *
 * console.log(endOfPacificDay(now).toISOString());
 * // Prints: "2026-10-23T06:59:59.999Z"
 *
 * console.log(addPacificDays(now, -3).toISOString());
 * // Prints: "2026-10-19T12:00:00.000Z"
 * ```
 *
 * @module
 */

const PACIFIC_TIME_ZONE = "America/Los_Angeles";

const pacificFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/** A Pacific wall-clock reading. `month` is 1-based. */
interface PacificWallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

/**
 * Reads the Pacific wall-clock time of an instant.
 *
 * @param date The instant to read.
 *
 * @returns The Pacific wall-clock parts of `date`.
 */
function getPacificWallClock(date: Date): PacificWallClock {
  const parts: Record<string, number> = {};
  for (const part of pacificFormatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
    millisecond: date.getUTCMilliseconds(),
  };
}

/**
 * Converts a wall-clock reading to epoch milliseconds as if it were UTC.
 *
 * @param wall The wall-clock reading.
 *
 * @returns Epoch milliseconds, rolling over out-of-range parts.
 */
function wallClockAsUtc(wall: PacificWallClock): number {
  return Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
    wall.millisecond,
  );
}

/**
 * Reads the Pacific UTC offset at an instant.
 *
 * @param epochMs The instant, in epoch milliseconds.
 *
 * @returns The offset in milliseconds (Pacific wall clock minus UTC), e.g. -7h in PDT.
 */
function getPacificOffset(epochMs: number): number {
  return wallClockAsUtc(getPacificWallClock(new Date(epochMs))) - epochMs;
}

/**
 * Finds the instant at which the Pacific wall clock reads the given time. Out
 * of range parts roll over (day 32 is the next month's first). A wall time
 * skipped by spring-forward (02:xx) resolves an hour off, and one repeated by
 * fall-back (01:xx) to one of its two instants; day bounds never hit either.
 *
 * @param wall The Pacific wall-clock time.
 *
 * @returns The matching instant.
 */
function fromPacificWallClock(wall: PacificWallClock): Date {
  const wallAsUtc = wallClockAsUtc(wall);

  // The offset at the first guess may differ from the offset at the answer
  // when a DST change falls between them; one correction settles it.
  const firstOffset = getPacificOffset(wallAsUtc);
  const secondOffset = getPacificOffset(wallAsUtc - firstOffset);

  return new Date(wallAsUtc - secondOffset);
}

/**
 * Gets the first instant (00:00:00.000 Pacific) of the Pacific day containing `date`.
 *
 * @param date Any instant.
 *
 * @returns A new Date at the start of that Pacific day.
 */
export function startOfPacificDay(date: Date): Date {
  return fromPacificWallClock({
    ...getPacificWallClock(date),
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
}

/**
 * Gets the last instant (23:59:59.999 Pacific) of the Pacific day containing `date`.
 *
 * @param date Any instant.
 *
 * @returns A new Date at the end of that Pacific day.
 */
export function endOfPacificDay(date: Date): Date {
  return fromPacificWallClock({
    ...getPacificWallClock(date),
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999,
  });
}

/**
 * Moves `date` by whole Pacific calendar days, keeping its Pacific wall-clock
 * time (so a step across a DST change is 23 or 25 hours, not 24).
 *
 * @param date Any instant.
 * @param days The number of days to move; negative moves back.
 *
 * @returns A new Date `days` Pacific days from `date`.
 */
export function addPacificDays(date: Date, days: number): Date {
  const wall = getPacificWallClock(date);
  return fromPacificWallClock({ ...wall, day: wall.day + days });
}
