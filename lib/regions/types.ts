/**
 * Types for the Region and Region Summary data structures.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  boundaryListSchema,
  boundarySchema,
  locationSchema,
  locationSourceSchema,
  regionCategorySchema,
  regionListItemSchema,
  regionSchema,
  regionsMetaSchema,
  regionSummarySchema,
  regionTypeMetaSchema,
  regionTypeSchema,
  regionWithSummariesSchema,
  retiredLocationSchema,
  retiredRegionSchema,
} from "./schemas/mod.ts";

/** The type of geography a region represents */
export type RegionType = zinfer<typeof regionTypeSchema>;

/** The backend classification a region's type belongs to */
export type RegionCategory = zinfer<typeof regionCategorySchema>;

/** A region's current boundary */
export type RegionBoundary = zinfer<typeof boundarySchema>;

/** A Region object returned from the SJVAir API */
export type RegionData = zinfer<typeof regionSchema>;

/** A region's current boundary as the regions list returns it: no `geometry` */
export type RegionListBoundary = zinfer<typeof boundaryListSchema>;

/**
 * A Region object as the regions list returns it. Its boundary has a `bbox`
 * but no `geometry`; use `getRegionDetails` for the full geometry.
 */
export type RegionListItem = zinfer<typeof regionListItemSchema>;

/** A single aggregated summary of a region's entries over a period of time */
export type RegionSummary = zinfer<typeof regionSummarySchema>;

/**
 * A Region object with its matching bulk summary rows attached. It has no
 * `external_id`, `retired` or `boundary`; get those from the regions list or
 * the region's details.
 */
export type RegionWithSummaries = zinfer<typeof regionWithSummariesSchema>;

/** The metadata about a given region type */
export type RegionTypeMeta = zinfer<typeof regionTypeMetaSchema>;

/** The metadata returned from regions/meta */
export type RegionsMetaData = zinfer<typeof regionsMetaSchema>;

/** The marker a retired region carries; its code still resolves */
export type RegionRetired = zinfer<typeof retiredRegionSchema>;

/** Where a location's code comes from */
export type LocationSource = zinfer<typeof locationSourceSchema>;

/** A school or child care location, looked up by its official code */
export type Location = zinfer<typeof locationSchema>;

/** The marker a retired location carries; its code still resolves */
export type LocationRetired = zinfer<typeof retiredLocationSchema>;
