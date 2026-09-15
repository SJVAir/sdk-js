/**
 * Types for the Region and Region Summary data structures.
 * @module
 */
import type { infer as zinfer } from "zod";
import type {
  boundarySchema,
  regionSchema,
  regionSummarySchema,
  regionTypeSchema,
} from "./schemas/mod.ts";

/** The type of geography a region represents */
export type RegionType = zinfer<typeof regionTypeSchema>;

/** A region's current boundary */
export type RegionBoundary = zinfer<typeof boundarySchema>;

/** A Region object returned from the SJVAir API */
export type RegionData = zinfer<typeof regionSchema>;

/** A single aggregated summary of a region's entries over a period of time */
export type RegionSummary = zinfer<typeof regionSummarySchema>;
