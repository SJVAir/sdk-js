/**
 * A utility function for fetching a list of the available entry archives for a monitor.
 *
 * @example Usage
 * ```ts
 * import { listAllMonitorArchives } from "@sjvair/sdk/monitors/get_monitors_archives";
 *
 * const archives = await listAllMonitorArchives("K40cQV3lRaWapiaYltjDbg");
 * console.log(archives);
 * // Prints:
 * //  [
 * //    {
 * //       "month": 4,
 * //       "year": 2021,
 * //       "url": "/api/1.0/monitors/K40cQV3lRaWapiaYltjDbg/archive/2021/4/"
 * //    },
 * //    {
 * //       "month": 7,
 * //       "year": 2021,
 * //       "url": "/api/1.0/monitors/K40cQV3lRaWapiaYltjDbg/archive/2021/7/"
 * //    },
 * //    ... (more items)
 * //  ]
 * ```
 *
 * @module
 */
import {
  apiCall,
  jsonCall,
  paginatedApiCall,
  type PaginatedResponse,
} from "$http";
import type { MonitorEntriesArchive } from "./types.ts";

/**
 * Fetches a single page of monitor entry archives.
 *
 * @param monitorId - The ID of the monitor to fetch archives for.
 * @param page - The page number to fetch (default is 1).
 * @returns A single page of monitor entry archives.
 */
export async function listMonitorArchivesPage(
  monitorId: string,
  page: number = 1,
) {
  return await jsonCall<PaginatedResponse<MonitorEntriesArchive>>(
    `monitors/${monitorId}/archives?page=${page}`,
  );
}

/**
 * Fetches all monitor entry archives for a given monitor.
 *
 * @param monitorId - The ID of the monitor to fetch archives for.
 * @returns An array of all monitor entry archives.
 */
export async function listAllMonitorArchives(
  monitorId: string,
): Promise<Array<MonitorEntriesArchive>> {
  return await paginatedApiCall<MonitorEntriesArchive>(
    `monitors/${monitorId}/archive`,
  );
}

/**
 * Fetches the contents of a monitor entry archive.
 *
 * @param archive - The archive to fetch.
 * @returns The contents of the archive as a string.
 */
export async function getMonitorArchive(
  archive: MonitorEntriesArchive,
): Promise<string> {
  return await apiCall<string>(
    archive.url.substring(9, archive.url.length - 1),
  );
}
