import * as z from "zod";
import { regionSchema } from "./region.ts";
import {
  type RegionSummarySchema,
  regionSummarySchema,
} from "./region_summary.ts";

export interface RegionWithSummariesSchema extends
  z.ZodObject<
    (typeof regionSchema)["shape"] & {
      /** The summary rows for this region within the requested range/page */
      summaries: z.ZodArray<RegionSummarySchema>;
    }
  > {}

export const regionWithSummariesSchema: RegionWithSummariesSchema = regionSchema
  .extend({
    summaries: z.array(regionSummarySchema),
  });
