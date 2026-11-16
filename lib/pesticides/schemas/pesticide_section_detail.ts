import * as z from "zod";
import {
  type RegionGeometrySchema,
  regionGeometrySchema,
} from "../../regions/schemas/region_geojson.ts";
import {
  type PesticideBadgeKeySchema,
  pesticideBadgeKeySchema,
} from "./badge.ts";

interface PesticideSectionYearSchema extends
  z.ZodObject<{
    /** The year */
    year: z.ZodNumber;
    /** Pounds of active ingredient */
    lbs_chemical: z.ZodNumber;
    /** Pounds of product applied */
    lbs_product: z.ZodNumber;
    /** Acres treated */
    acres_treated: z.ZodNumber;
    /** The number of applications */
    applications: z.ZodNumber;
  }> {}

const pesticideSectionYearSchema: PesticideSectionYearSchema = z.object({
  year: z.number(),
  lbs_chemical: z.number(),
  lbs_product: z.number(),
  acres_treated: z.number(),
  applications: z.number(),
});

interface PesticideSectionMonthSchema extends
  z.ZodObject<{
    /** The month, 1-12 */
    month: z.ZodNumber;
    /** Pounds of active ingredient */
    lbs_chemical: z.ZodNumber;
    /** Acres treated */
    acres_treated: z.ZodNumber;
    /** The number of applications */
    applications: z.ZodNumber;
  }> {}

const pesticideSectionMonthSchema: PesticideSectionMonthSchema = z.object({
  month: z.number(),
  lbs_chemical: z.number(),
  acres_treated: z.number(),
  applications: z.number(),
});

interface PesticideSectionTopEntrySchema extends
  z.ZodObject<{
    /** The id, as the `*_id` filters and the details functions take it */
    id: z.ZodString;
    /** The CDPR name */
    name: z.ZodString;
    /** The name for display */
    display_name: z.ZodString;
    /** Pounds applied in the section for the year */
    lbs: z.ZodNumber;
  }> {}

const pesticideSectionTopEntrySchema: PesticideSectionTopEntrySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    display_name: z.string(),
    lbs: z.number(),
  });

interface PesticideSectionTopChemicalSchema extends
  z.ZodObject<{
    /** The chemical's id */
    id: z.ZodString;
    /** The chemical's CDPR name */
    name: z.ZodString;
    /** The chemical's name for display */
    display_name: z.ZodString;
    /** Pounds of the chemical applied in the section for the year */
    lbs: z.ZodNumber;
    /** Whether the chemical is one of concern */
    is_of_concern: z.ZodBoolean;
    /**
     * The keys of the badges the chemical carries, in the order of
     * `getPesticidesMeta().badges`
     */
    badges: z.ZodArray<PesticideBadgeKeySchema>;
  }> {}

const pesticideSectionTopChemicalSchema: PesticideSectionTopChemicalSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    display_name: z.string(),
    lbs: z.number(),
    is_of_concern: z.boolean(),
    badges: z.array(pesticideBadgeKeySchema),
  });

/** One MTRS section's pesticide use, from `getPesticideSectionDetails` */
export interface PesticideSectionDetailSchema extends
  z.ZodObject<{
    /** The section's id */
    id: z.ZodString;
    /** The section's MTRS code */
    mtrs: z.ZodString;
    /** The name of the county its use is filed under, or null */
    county: z.ZodNullable<z.ZodString>;
    /** The year `months` and the top lists cover, `"all"`, or null with no data loaded */
    year: z.ZodNullable<
      z.ZodUnion<readonly [z.ZodNumber, z.ZodLiteral<"all">]>
    >;
    /** The section's outline, or null */
    geometry: z.ZodNullable<RegionGeometrySchema>;
    /** The totals for every year with use, newest first */
    years: z.ZodArray<PesticideSectionYearSchema>;
    /** The year's totals by month: 12 rows, zero-filled (empty with no year) */
    months: z.ZodArray<PesticideSectionMonthSchema>;
    /** The year's top five chemicals by pounds */
    top_chemicals: z.ZodArray<PesticideSectionTopChemicalSchema>;
    /** The year's top five products by pounds */
    top_products: z.ZodArray<PesticideSectionTopEntrySchema>;
    /** The year's top five commodities by pounds of chemical */
    top_commodities: z.ZodArray<PesticideSectionTopEntrySchema>;
  }> {}

export const pesticideSectionDetailSchema: PesticideSectionDetailSchema = z
  .object({
    id: z.string(),
    mtrs: z.string(),
    county: z.nullable(z.string()),
    year: z.nullable(z.union([z.number(), z.literal("all")])),
    geometry: z.nullable(regionGeometrySchema),
    years: z.array(pesticideSectionYearSchema),
    months: z.array(pesticideSectionMonthSchema),
    top_chemicals: z.array(pesticideSectionTopChemicalSchema),
    top_products: z.array(pesticideSectionTopEntrySchema),
    top_commodities: z.array(pesticideSectionTopEntrySchema),
  });
