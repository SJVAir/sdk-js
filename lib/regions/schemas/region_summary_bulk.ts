import * as z from "zod";
import { regionSchema } from "./region.ts";
import {
  type RegionSummarySchema,
  regionSummarySchema,
} from "./region_summary.ts";

export interface RegionWithSummariesSchema extends
  z.ZodObject<
    Omit<(typeof regionSchema)["shape"], "boundary"> & {
      /** The summary rows for this region within the requested range/page */
      summaries: z.ZodArray<RegionSummarySchema>;
    }
  > {}

/**
 * A region with its bulk summary rows attached. The bulk endpoints leave out
 * the region's `boundary` (it would repeat on every page a region spans);
 * fetch it from the regions list or the region's details.
 */
export const regionWithSummariesSchema: RegionWithSummariesSchema = regionSchema
  .omit({ boundary: true })
  .extend({
    summaries: z.array(regionSummarySchema),
  });
