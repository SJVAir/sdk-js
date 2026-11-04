/**
 * Types for the dataset catalog.
 * @module
 */
import type { infer as zinfer } from "zod";
import type { RegionType } from "../regions/types.ts";
import type {
  choiceSchema,
  coverageSchema,
  datasetCatalogEntrySchema,
  datasetCatalogSchema,
  datasetEntryDisplaySchema,
  datasetEntryTypeSchema,
  placeSchema,
  resolutionSchema,
  retiredSchema,
  scaleLevelSchema,
  scaleSchema,
  scaleSourceSchema,
} from "./schemas/mod.ts";

/** A summary resolution an entry type can be read at */
export type Resolution = zinfer<typeof resolutionSchema>;

/** A kind of place a dataset's data is attached to */
export type Geography =
  | "monitor"
  | "region"
  | "point"
  | "polygon"
  | "zone"
  | "zip"
  | "tract"
  // deno-lint-ignore ban-types
  | (string & {});

/** The marker on a dataset or entry type that is no longer current */
export type Retired = zinfer<typeof retiredSchema>;

/** The broad class an entry type belongs to */
export type DatasetEntryKind =
  | "pollutant"
  | "meteorological"
  | "other"
  // deno-lint-ignore ban-types
  | (string & {});

/** Hints for presenting an entry type's values */
export type DatasetEntryDisplay = zinfer<typeof datasetEntryDisplaySchema>;

/** A scale that turns a value into a named, colored level */
export type Scale = zinfer<typeof scaleSchema>;

/** One level (breakpoint or category) of a scale */
export type ScaleLevel = zinfer<typeof scaleLevelSchema>;

/** Where a scale's breakpoints come from */
export type ScaleSource = zinfer<typeof scaleSourceSchema>;

/** A documented option, such as a data stage or a processor */
export type Choice = zinfer<typeof choiceSchema>;

/** One entry type of a dataset */
export type DatasetEntryType = zinfer<typeof datasetEntryTypeSchema>;

/** One dataset in the catalog */
export type DatasetCatalogEntry = zinfer<typeof datasetCatalogEntrySchema>;

/** The catalog returned from meta/datasets */
export type DatasetCatalog = zinfer<typeof datasetCatalogSchema>;

/**
 * What to ask meta/coverage about. Without `monitor` or `region` it answers
 * for the whole dataset. `monitor` and `region` are mutually exclusive, both
 * need an `entry_type`, and land-use regions have no codes to look up.
 */
export type CoverageQuery = {
  /** The dataset id, such as `air-quality` */
  dataset: string;
  /** Narrows the answer to one entry type of the dataset */
  entry_type?: string;
  /** A monitor id (air-quality and weather only) */
  monitor?: string;
  /** A region, by its type and official code (air-quality only) */
  region?: {
    type: Exclude<RegionType, "land_use">;
    external_id: string;
  };
};

/**
 * The first and last Pacific calendar dates (`YYYY-MM-DD` strings, not
 * `Date`s) of a dataset's data; both are null when there is none.
 */
export type Coverage = zinfer<typeof coverageSchema>;

/** The place a by-place answer is about, as echoed back by the server */
export type Place = zinfer<typeof placeSchema>;
