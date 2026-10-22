/**
 * A collection of utilities for interacting with the SJVAir meta API
 *
 * @example Usage
 * ```ts
 * import { getDatasetCatalog } from "@sjvair/sdk/meta";
 *
 * const catalog = await getDatasetCatalog();
 * console.log(catalog.datasets.map((dataset) => dataset.id));
 * // Prints: [ "air-quality", "weather", "hms-smoke", ... ]
 * ```
 *
 * @module
 */
export * from "./get_dataset_catalog.ts";
export * from "./types.ts";
