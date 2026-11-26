/**
 * A utility function for fetching the first and last dates of a dataset's data.
 *
 * @example Usage
 * ```ts
 * import { getCoverage } from "@sjvair/sdk/meta/get_coverage";
 *
 * const coverage = await getCoverage({ dataset: "air-quality" });
 * console.log(coverage.first, coverage.last);
 * // Prints: 2019-03-14 2026-10-22
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { RegionType } from "../regions/types.ts";
import type { Coverage, CoverageQuery } from "./types.ts";

/**
 * Fetches the first and last Pacific calendar dates of data for a dataset,
 * optionally narrowed to an entry type and to one monitor or region. Dates are
 * `YYYY-MM-DD` strings; both are `null` when there is no data.
 *
 * @example Usage
 * ```ts
 * import { getCoverage } from "@sjvair/sdk/meta/get_coverage";
 *
 * const fresno = await getCoverage({
 *   dataset: "air-quality",
 *   entry_type: "pm25",
 *   region: { type: "county", external_id: "06019" },
 * });
 * console.log(fresno.first, fresno.last);
 * ```
 *
 * @param query The dataset, and optionally an entry type and one monitor or
 * region. `monitor` and `region` need an `entry_type`; land-use regions can't
 * be looked up by code.
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The dataset, entry type, monitor or region asked about, and the
 * `first` and `last` dates of data.
 */
export async function getCoverage(
  query: CoverageQuery,
  options?: RequestOptions,
): Promise<Coverage> {
  const { dataset, entry_type, monitor, region } = query;
  if (monitor !== undefined && region !== undefined) {
    throw new Error("getCoverage takes either a monitor or a region, not both");
  }
  if ((region?.type as RegionType | undefined) === "land_use") {
    throw new Error("Land-use regions can't be looked up by code");
  }

  const searchParams: Record<string, string> = { dataset };
  if (entry_type !== undefined) searchParams.entry_type = entry_type;
  if (monitor !== undefined) searchParams.monitor = monitor;
  if (region !== undefined) {
    searchParams.region_type = region.type;
    searchParams.region = region.external_id;
  }

  return await jsonCall<Coverage>({
    url: "meta/coverage",
    searchParams,
    options,
  });
}
