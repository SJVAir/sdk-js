import type { MonitorEntries } from "../types.ts";
import type {
  FetchMonitorEntriesResponse,
  MonitorEntryRequestConfig,
} from "./types.ts";

/**
 * Fetch all pages of entries for a given monitor, with the provided request callback.
 *
 * @param config An object containing the monitor ID and search parameters
 *
 * @returns An array of monitor entries
 */
export async function gatherMonitorEntries<T extends MonitorEntryRequestConfig>(
  config: T,
  cb: (
    config: T,
  ) => Promise<FetchMonitorEntriesResponse<T["field"]>>,
): Promise<Array<MonitorEntries[T["field"]]>> {
  const totalEntries: Array<MonitorEntries[T["field"]]> = [];

  try {
    const { body: { data, has_next_page, page } } = await cb(config);

    if (data.length) {
      totalEntries.push(...data);

      if (has_next_page) {
        Object.assign(config, { page: `${page + 1}` });
        await cb(config);
      }
    }

    return totalEntries;
  } catch (err) {
    console.error("Failed to fetch monitor entries", err);
    return [] as Array<MonitorEntries[T["field"]]>;
  }
}
