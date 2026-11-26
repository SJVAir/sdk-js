import * as z from "zod";
import { regionTypeSchema } from "../../regions/schemas/region_type.ts";

/** A Pacific calendar date as `YYYY-MM-DD` */
const dateSchema: z.ZodString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

interface CoverageRegionSchema extends
  z.ZodObject<{
    type: typeof regionTypeSchema;
    external_id: z.ZodString;
  }> {}
/** The region a coverage answer is about */
export const coverageRegionSchema: CoverageRegionSchema = z.object({
  type: regionTypeSchema,
  external_id: z.string(),
});

interface CoverageSchema extends
  z.ZodObject<{
    dataset: z.ZodString;
    entry_type: z.ZodNullable<z.ZodString>;
    monitor: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<CoverageRegionSchema>;
    first: z.ZodNullable<z.ZodString>;
    last: z.ZodNullable<z.ZodString>;
  }> {}
/**
 * The first and last Pacific dates of data, as returned from meta/coverage.
 * `monitor` or `region` is present only when one was asked about.
 */
export const coverageSchema: CoverageSchema = z.object({
  dataset: z.string(),
  entry_type: z.string().nullable(),
  monitor: z.string().optional(),
  region: coverageRegionSchema.optional(),
  first: dateSchema.nullable(),
  last: dateSchema.nullable(),
});
