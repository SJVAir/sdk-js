import * as z from "zod";

export type MonitorEntriesArchiveSchema = z.ZodObject<{
  /** The month of which the archive contains entries for */
  month: z.ZodNumber;

  /** The number representation of the monitor's health */
  year: z.ZodNumber;

  /** The relative percent difference between channels */
  url: z.ZodString;
}>;

export const monitorEntriesArchiveSchema: MonitorEntriesArchiveSchema = z
  .object({
    month: z.number(),
    year: z.number(),
    url: z.string(),
  });
