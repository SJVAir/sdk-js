import * as z from "zod";
import { monitorSummaryResolutionSchema } from "../../monitors/schemas/monitor_summary.ts";

export interface RegionSummarySchema extends
  z.ZodObject<{
    /** The start of the period this summary covers */
    timestamp: z.ZodString;

    /** The type of data this summary represents */
    entry_type: z.ZodString;

    /** The resolution this summary was aggregated at */
    resolution: typeof monitorSummaryResolutionSchema;

    /** The number of entries included in this summary */
    count: z.ZodNumber;

    /** The number of entries expected for this summary to be considered complete */
    expected_count: z.ZodNumber;

    /** The minimum value recorded during this summary's period */
    minimum: z.ZodNumber;

    /** The maximum value recorded during this summary's period */
    maximum: z.ZodNumber;

    /** The mean value recorded during this summary's period */
    mean: z.ZodNumber;

    /** The standard deviation of the values recorded during this summary's period */
    stddev: z.ZodNumber;

    /** The 25th percentile value recorded during this summary's period */
    p25: z.ZodNumber;

    /** The 75th percentile value recorded during this summary's period */
    p75: z.ZodNumber;

    /** The number of monitor stations included in this summary's period */
    station_count: z.ZodNumber;
  }> {}

export const regionSummarySchema: RegionSummarySchema = z.object({
  timestamp: z.string(),
  entry_type: z.string(),
  resolution: monitorSummaryResolutionSchema,
  count: z.number(),
  expected_count: z.number(),
  minimum: z.number(),
  maximum: z.number(),
  mean: z.number(),
  stddev: z.number(),
  p25: z.number(),
  p75: z.number(),
  station_count: z.number(),
});
