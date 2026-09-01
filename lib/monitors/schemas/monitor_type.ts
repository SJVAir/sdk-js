import * as z from "zod";

export type MonitorTypeSchema = z.ZodEnum<{
  airgradient: "airgradient";
  airnow: "airnow";
  aqlite: "aqlite";
  aqview: "aqview";
  bam1022: "bam1022";
  purpleair: "purpleair";
  vozbox: "vozbox";
}>;

//** The group a monitor belongs to */
export const monitorTypeSchema: MonitorTypeSchema = z.enum(
  [
    "airgradient",
    "airnow",
    "aqlite",
    "aqview",
    "bam1022",
    "purpleair",
    "vozbox",
  ] as const,
);
