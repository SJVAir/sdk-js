import * as z from "zod";

/** The IARC carcinogenicity classification group of a chemical */
export type IARCGroupSchema = z.ZodEnum<{
  "1": "1";
  "2A": "2A";
  "2B": "2B";
  "3": "3";
}>;

export const iarcGroupSchema: IARCGroupSchema = z.enum(
  ["1", "2A", "2B", "3"] as const,
);
