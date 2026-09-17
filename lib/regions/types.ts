/**
 * Types for the Region and Region Summary data structures.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  boundarySchema,
  regionCategorySchema,
  regionSchema,
  regionsMetaSchema,
  regionSummarySchema,
  regionTypeMetaSchema,
  regionTypeSchema,
} from "./schemas/mod.ts";

/** The type of geography a region represents */
export type RegionType = zinfer<typeof regionTypeSchema>;

/** The backend classification a region's type belongs to */
export type RegionCategory = zinfer<typeof regionCategorySchema>;

/** A region's current boundary */
export type RegionBoundary = zinfer<typeof boundarySchema>;

/** A Region object returned from the SJVAir API */
export type RegionData = zinfer<typeof regionSchema>;

/** A single aggregated summary of a region's entries over a period of time */
export type RegionSummary = zinfer<typeof regionSummarySchema>;

/** The metadata about a given region type */
export type RegionTypeMeta = zinfer<typeof regionTypeMetaSchema>;

/** The metadata returned from regions/meta */
export type RegionsMetaData = zinfer<typeof regionsMetaSchema>;
