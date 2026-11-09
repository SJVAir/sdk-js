import * as z from "zod";

/** The resolution a monitor summary was aggregated at */
export type MonitorSummaryResolutionSchema = z.ZodEnum<{
  hour: "hour";
  day: "day";
  month: "month";
  quarter: "quarter";
  season: "season";
  year: "year";
}>;

export const monitorSummaryResolutionSchema: MonitorSummaryResolutionSchema = z
  .enum(["hour", "day", "month", "quarter", "season", "year"] as const);

export interface MonitorSummarySchema extends
  z.ZodObject<{
    /** The start of the period this summary covers */
    timestamp: z.ZodString;

    /** The type of data this summary represents */
    entry_type: z.ZodString;

    /** The resolution this summary was aggregated at */
    resolution: MonitorSummaryResolutionSchema;

    /** The processor used to derive the summarized values */
    processor: z.ZodString;

    /** The number of entries included in this summary */
    count: z.ZodNumber;

    /**
     * The total of the values recorded during this summary's period; for
     * precipitation, ETo and ETr this is the period's total
     */
    sum: z.ZodNumber;

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

    /**
     * The day's highest 1-hour average (O3, NO2, SO2): set only on daily rows
     * of an entry type whose scale's `daily_statistic` is `max_1h`, and `null`
     * on a day that fails EPA's completeness rule
     */
    max_1h: z.ZodNullable<z.ZodNumber>;

    /**
     * The day's highest 8-hour average (CO): set only on daily rows of an
     * entry type whose scale's `daily_statistic` is `max_8h`, and `null` on a
     * day that fails EPA's completeness rule
     */
    max_8h: z.ZodNullable<z.ZodNumber>;

    /**
     * The day's 24-hour average (PM2.5, PM10): set only on daily rows of an
     * entry type whose scale's `daily_statistic` is `mean_24h`, and `null` on
     * a day with fewer than 75% of its hours
     */
    mean_24h: z.ZodNullable<z.ZodNumber>;

    /** Indicates whether this summary's period had the expected number of entries */
    is_complete: z.ZodBoolean;

    /**
     * Whether this row can't change anymore. Yesterday's daily row settles
     * about 03:00 Pacific (CO's about 28 hours after the day ends); open-day
     * rows are always `false`
     */
    is_final: z.ZodBoolean;
  }> {}

export const monitorSummarySchema: MonitorSummarySchema = z.object({
  timestamp: z.string(),
  entry_type: z.string(),
  resolution: monitorSummaryResolutionSchema,
  processor: z.string(),
  count: z.number(),
  sum: z.number(),
  expected_count: z.number(),
  minimum: z.number(),
  maximum: z.number(),
  mean: z.number(),
  stddev: z.number(),
  p25: z.number(),
  p75: z.number(),
  max_1h: z.number().nullable(),
  max_8h: z.number().nullable(),
  mean_24h: z.number().nullable(),
  is_complete: z.boolean(),
  is_final: z.boolean(),
});
