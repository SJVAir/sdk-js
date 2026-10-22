/**
 * Types for the dataset catalog.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  datasetCatalogEntrySchema,
  datasetCatalogSchema,
  datasetEntryTypeSchema,
  geographySchema,
  resolutionSchema,
  retiredSchema,
} from "./schemas/mod.ts";

/** A summary resolution an entry type can be read at */
export type Resolution = zinfer<typeof resolutionSchema>;

/** A kind of place a dataset's data is attached to */
export type Geography = zinfer<typeof geographySchema>;

/** The marker on a dataset or entry type that is no longer current */
export type Retired = zinfer<typeof retiredSchema>;

/** One entry type of a dataset */
export type DatasetEntryType = zinfer<typeof datasetEntryTypeSchema>;

/** One dataset in the catalog */
export type DatasetCatalogEntry = zinfer<typeof datasetCatalogEntrySchema>;

/** The catalog returned from meta/datasets */
export type DatasetCatalog = zinfer<typeof datasetCatalogSchema>;
