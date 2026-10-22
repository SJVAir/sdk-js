/**
 * A utility function for fetching the catalog of datasets the API serves.
 *
 * @example Usage
 * ```ts
 * import { getDatasetCatalog } from "@sjvair/sdk/meta/get_dataset_catalog";
 *
 * const catalog = await getDatasetCatalog();
 * const airQuality = catalog.datasets.find((d) => d.id === "air-quality");
 * console.log(airQuality?.entry_types.map((e) => e.id));
 * // Prints: [ "co", "co2", "humidity", "no2", "o3", "pm25", ... ]
 * console.log(catalog.summary_rules);
 * // Prints: { complete_after_period_end: [ "month", "quarter", "season", "year" ] }
 * ```
 *
 * @module
 */
import { jsonCall, type RequestOptions } from "$http";
import type { DatasetCatalog } from "./types.ts";

/**
 * Fetches the catalog of every dataset, its entry types, geographies, and the
 * summary resolutions each entry type supports.
 *
 * @example Usage
 * ```ts
 * import { getDatasetCatalog } from "@sjvair/sdk/meta/get_dataset_catalog";
 *
 * const { datasets } = await getDatasetCatalog();
 * console.log(datasets.map((d) => d.id));
 * ```
 *
 * @param options Optional per-request options: an AbortSignal and extra fetch init.
 *
 * @returns The dataset catalog.
 */
export async function getDatasetCatalog(
  options?: RequestOptions,
): Promise<DatasetCatalog> {
  return await jsonCall<DatasetCatalog>({ url: "meta/datasets", options });
}
