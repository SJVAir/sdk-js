import * as z from "zod";
import { placeSchema } from "../../meta/schemas/mod.ts";

interface PesticideUseTotalsSchema extends
  z.ZodObject<{
    /** Pounds of active ingredient applied */
    pounds: z.ZodNumber;
    /** Acres treated */
    acres: z.ZodNumber;
    /** Number of applications (use records) */
    applications: z.ZodNumber;
  }> {}
/** Pesticide use totals: pounds, acres and application count */
export const pesticideUseTotalsSchema: PesticideUseTotalsSchema = z.object({
  pounds: z.number(),
  acres: z.number(),
  applications: z.number(),
});

interface PesticideMonthSchema extends
  z.ZodObject<{
    /** The calendar year */
    year: z.ZodNumber;
    /** The month, 1 to 12 */
    month: z.ZodNumber;
    /** Pounds of active ingredient applied */
    pounds: z.ZodNumber;
    /** Acres treated */
    acres: z.ZodNumber;
    /** Number of applications (use records) */
    applications: z.ZodNumber;
  }> {}
/** One month of pesticide use in a place */
export const pesticideMonthSchema: PesticideMonthSchema = z.object({
  year: z.number(),
  month: z.number(),
  pounds: z.number(),
  acres: z.number(),
  applications: z.number(),
});

interface PesticideYearSchema extends
  z.ZodObject<{
    /** The calendar year */
    year: z.ZodNumber;
    /** Pounds of active ingredient applied, including undated records */
    pounds: z.ZodNumber;
    /** Acres treated, including undated records */
    acres: z.ZodNumber;
    /** Number of applications, including undated records */
    applications: z.ZodNumber;
    /**
     * The part of the year's totals from records with no application date,
     * which belong to no month
     */
    undated: typeof pesticideUseTotalsSchema;
  }> {}
/** One year of pesticide use in a place */
export const pesticideYearSchema: PesticideYearSchema = z.object({
  year: z.number(),
  pounds: z.number(),
  acres: z.number(),
  applications: z.number(),
  undated: pesticideUseTotalsSchema,
});

interface PesticidesForPlaceSchema extends
  z.ZodObject<{
    /** The place asked about */
    place: typeof placeSchema;
    /** Use by month; only months with use appear */
    months: z.ZodArray<PesticideMonthSchema>;
    /** Use by year; each year's totals include its undated records */
    years: z.ZodArray<PesticideYearSchema>;
  }> {}
/** Monthly and yearly pesticide use for a place, as returned from pesticides/place */
export const pesticidesForPlaceSchema: PesticidesForPlaceSchema = z.object({
  place: placeSchema,
  months: z.array(pesticideMonthSchema),
  years: z.array(pesticideYearSchema),
});
