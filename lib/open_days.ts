/**
 * Merges stored daily summary rows with "open day" rows: today's figures so
 * far, plus yesterday's until its nightly row exists (about 03:00 Pacific).
 * Fetch the stored rows with a daily summary call and the open rows with the
 * matching `...DailyOpen` call, then merge them here.
 *
 * Read the merged rows like this:
 *
 * - `is_final: false` on today means "so far";
 * - `is_final: false` on an earlier day means "not final yet";
 * - a missing row means "no data".
 *
 * Neither function trims rows to a date range: ask for open days only when the
 * range reaches yesterday or today.
 *
 * @example Usage
 * ```ts
 * import {
 *   getMonitorSummariesDaily,
 *   getMonitorSummariesDailyOpen,
 * } from "@sjvair/sdk/monitors";
 * import { mergeOpenDays } from "@sjvair/sdk/open-days";
 *
 * const config = { monitorId: "xgXCRh68SdG5FOdbUXvR6Q", entryType: "pm25" };
 * const [stored, open] = await Promise.all([
 *   getMonitorSummariesDaily({ ...config, year: 2026, month: 11 }),
 *   getMonitorSummariesDailyOpen(config),
 * ]);
 * const days = mergeOpenDays(stored, open);
 * ```
 *
 * @module
 */

/**
 * Merges one place's stored daily rows with its open-day rows.
 *
 * Returns the stored rows plus every open row for a day no stored row has,
 * sorted by time. When both have a day, the stored row wins: just after a
 * nightly rollup the two endpoints can briefly both have it. A day repeated
 * within `open` is kept once (the first). Neither input is changed.
 *
 * @param stored Rows from a daily summary list
 * @param open Rows from the matching open-days endpoint
 *
 * @returns A new array of rows, sorted by `timestamp`
 */
export function mergeOpenDays<T extends { timestamp: string }>(
  stored: ReadonlyArray<T>,
  open: ReadonlyArray<T>,
): Array<T> {
  const seen = new Set(stored.map((row) => row.timestamp));
  const merged = [...stored];

  for (const row of open) {
    if (!seen.has(row.timestamp)) {
      seen.add(row.timestamp);
      merged.push(row);
    }
  }

  // Offsets differ across daylight saving time, so order by instant. Parse
  // each timestamp once, and skip the sort when the rows are already in order
  // (the usual case: stored days, then the open days after them).
  const times = merged.map((row) => Date.parse(row.timestamp));
  if (times.every((time, i) => i === 0 || times[i - 1] <= time)) {
    return merged;
  }
  return merged
    .map((row, i) => ({ row, time: times[i] }))
    .sort((a, b) => a.time - b.time)
    .map(({ row }) => row);
}

/**
 * Folds entries with the same `id` into one: the first entry's fields, all
 * their rows. A single entry's rows are copied, not sorted; the merge below
 * sorts each owner's rows once.
 */
function foldOwners<
  T extends { id: string; summaries: Array<{ timestamp: string }> },
>(owners: ReadonlyArray<T>): Map<string, T> {
  const folded = new Map<string, T>();

  for (const owner of owners) {
    const first = folded.get(owner.id);
    folded.set(
      owner.id,
      first
        ? {
          ...first,
          summaries: mergeOpenDays(first.summaries, owner.summaries),
        }
        : { ...owner, summaries: [...owner.summaries] },
    );
  }

  return folded;
}

/**
 * Merges bulk daily summary results with bulk open-day results, matching
 * monitors or regions by `id`.
 *
 * An owner in both gets its rows merged with {@linkcode mergeOpenDays} and
 * keeps the stored entry's other fields. An owner only in `stored` is kept; an
 * owner only in `open` (for example a monitor whose first data is today) is
 * added after the stored owners. Entries repeated within one input are folded
 * into one first. Neither input is changed.
 *
 * @param stored Owners from a bulk daily summary list
 * @param open Owners from the matching bulk open-days endpoint
 *
 * @returns A new array of owners, each with new `summaries` sorted by `timestamp`
 */
export function mergeBulkOpenDays<
  T extends { id: string; summaries: Array<{ timestamp: string }> },
>(stored: ReadonlyArray<T>, open: ReadonlyArray<T>): Array<T> {
  const storedOwners = foldOwners(stored);
  const openOwners = foldOwners(open);
  const merged: Array<T> = [];

  for (const [id, owner] of storedOwners) {
    const opened = openOwners.get(id);
    merged.push({
      ...owner,
      summaries: mergeOpenDays(owner.summaries, opened?.summaries ?? []),
    });
  }

  for (const [id, owner] of openOwners) {
    if (!storedOwners.has(id)) {
      merged.push({ ...owner, summaries: mergeOpenDays([], owner.summaries) });
    }
  }

  return merged;
}
