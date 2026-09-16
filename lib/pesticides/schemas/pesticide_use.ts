import * as z from "zod";
import {
  type AerialGroundSchema,
  aerialGroundSchema,
} from "./aerial_ground.ts";
import {
  type PesticideRegionSchema,
  pesticideRegionSchema,
} from "./pesticide_region.ts";
import { type ProductSchema, productSchema } from "./product.ts";
import { type ChemicalSchema, chemicalSchema } from "./chemical.ts";
import { type CommoditySchema, commoditySchema } from "./commodity.ts";

export interface PesticideUseSchema extends
  z.ZodObject<{
    /** The ID of the pesticide use record */
    id: z.ZodString;

    /** The year the application occurred */
    year: z.ZodNumber;

    /** The DPR use number */
    use_no: z.ZodNumber;

    /** The COMTRS (county/meridian/township/range/section) of the application */
    comtrs: z.ZodString;

    /** The pounds of chemical applied */
    lbs_chemical: z.ZodNullable<z.ZodNumber>;

    /** The acres treated */
    acres_treated: z.ZodNullable<z.ZodNumber>;

    /** The date the application occurred */
    application_date: z.ZodNullable<z.ZodString>;

    /** The application method */
    aerial_ground: z.ZodUnion<readonly [AerialGroundSchema, z.ZodLiteral<"">]>;

    /** The county the application occurred in */
    county: PesticideRegionSchema;

    /** The MTRS section region the application occurred in */
    mtrs: z.ZodNullable<PesticideRegionSchema>;

    /** The product applied */
    product: z.ZodNullable<ProductSchema>;

    /** The chemical applied */
    chemical: z.ZodNullable<ChemicalSchema>;

    /** The commodity the application was made to */
    commodity: z.ZodNullable<CommoditySchema>;
  }> {}

export const pesticideUseSchema: PesticideUseSchema = z.object({
  id: z.string(),
  year: z.number(),
  use_no: z.number(),
  comtrs: z.string(),
  lbs_chemical: z.nullable(z.number()),
  acres_treated: z.nullable(z.number()),
  application_date: z.nullable(z.string()),
  aerial_ground: z.union([aerialGroundSchema, z.literal("")]),
  county: pesticideRegionSchema,
  mtrs: z.nullable(pesticideRegionSchema),
  product: z.nullable(productSchema),
  chemical: z.nullable(chemicalSchema),
  commodity: z.nullable(commoditySchema),
});
