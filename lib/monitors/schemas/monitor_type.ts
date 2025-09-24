import * as z from "zod";

export type MonitorTypeSchema = z.ZodEnum<{
  airgradient: "airgradient";
  airnow: "airnow";
  aqview: "aqview";
  bam1022: "bam1022";
  purpleair: "purpleair";
}>;

//** The group a monitor belongs to */
export const monitorTypeSchema: MonitorTypeSchema = z.enum(
  ["airgradient", "airnow", "aqview", "bam1022", "purpleair"] as const,
);
