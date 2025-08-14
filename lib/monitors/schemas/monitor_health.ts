import * as z from "zod";

export type MonitorHealthSchema = z.ZodObject<{
  /** The timestamp of the health check */
  hour: z.ZodString;

  /** The number representation of the monitor's health */
  score: z.ZodNumber;

  /** The relative percent difference between channels */
  rpd_pairwise: z.ZodNullable<z.ZodNumber>;

  /** The correlation between channels */
  correlation: z.ZodNullable<z.ZodNumber>;

  /** States whether or not the sensor is returning valid data */
  channel_a_sanity: z.ZodBoolean;

  /** States whether or not the sensor is returning valid data */
  channel_b_sanity: z.ZodBoolean;

  /** The letter representation of the monitor's health */
  grade: z.ZodString;
}>;

export const monitorHealthSchema: MonitorHealthSchema = z.object({
  hour: z.string(),
  score: z.number(),
  rpd_pairwise: z.nullable(z.number()),
  correlation: z.nullable(z.number()),
  channel_a_sanity: z.boolean(),
  channel_b_sanity: z.boolean(),
  grade: z.string(),
});
