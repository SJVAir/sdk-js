import * as z from "zod";
import { type ChemicalSchema, chemicalSchema } from "./chemical.ts";
import { type CommoditySchema, commoditySchema } from "./commodity.ts";
import {
  type PesticideRegionSchema,
  pesticideRegionSchema,
} from "./pesticide_region.ts";

export interface PesticideSummarySchema extends
  z.ZodObject<{
    /** The year this summary row covers */
    year: z.ZodNumber;

    /** The chemical this summary row is aggregated by */
    chemical: z.ZodNullable<ChemicalSchema>;

    /** The commodity this summary row is aggregated by */
    commodity: z.ZodNullable<CommoditySchema>;

    /** The total pounds of chemical applied */
    total_lbs: z.ZodNullable<z.ZodNumber>;

    /** The total acres treated */
    total_acres: z.ZodNullable<z.ZodNumber>;

    /** The number of applications included in this summary row */
    application_count: z.ZodNumber;
  }> {}

export const pesticideSummarySchema: PesticideSummarySchema = z.object({
  year: z.number(),
  chemical: z.nullable(chemicalSchema),
  commodity: z.nullable(commoditySchema),
  total_lbs: z.nullable(z.number()),
  total_acres: z.nullable(z.number()),
  application_count: z.number(),
});

export interface PesticideSummaryResponseSchema extends
  z.ZodObject<{
    /** The region this summary was aggregated for */
    region: PesticideRegionSchema;

    /** The aggregated summary rows */
    data: z.ZodArray<PesticideSummarySchema>;

    /** The number of rows included in the response */
    count: z.ZodNumber;
  }> {}

export const pesticideSummaryResponseSchema: PesticideSummaryResponseSchema = z
  .object({
    region: pesticideRegionSchema,
    data: z.array(pesticideSummarySchema),
    count: z.number(),
  });
