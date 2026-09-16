import * as z from "zod";
import { type GeoJSONPointSchema, geoJSONPointSchema } from "../../schema.ts";
import {
  type PesticideRegionSchema,
  pesticideRegionSchema,
} from "./pesticide_region.ts";
import { type ChemicalSchema, chemicalSchema } from "./chemical.ts";
import { type ProductSchema, productSchema } from "./product.ts";

export interface PesticideNoticeSchema extends
  z.ZodObject<{
    /** The ID of the pesticide notice */
    id: z.ZodString;

    /** The CDFA application ID */
    application_id: z.ZodNumber;

    /** The COMTRS (county/meridian/township/range/section) of the application */
    comtrs: z.ZodString;

    /** The county the application will occur in */
    county: PesticideRegionSchema;

    /** The geolocation of the application, as GeoJSON */
    point: z.ZodNullable<GeoJSONPointSchema>;

    /** The date and time the application is scheduled for */
    scheduled_application: z.ZodString;

    /** The amount of material treated */
    treated_amount: z.ZodNullable<z.ZodNumber>;

    /** The units of the treated amount */
    treated_units: z.ZodString;

    /** The method of application */
    application_method: z.ZodString;

    /** The chemicals involved in the application */
    chemicals: z.ZodArray<ChemicalSchema>;

    /** The products involved in the application */
    products: z.ZodArray<ProductSchema>;
  }> {}

export const pesticideNoticeSchema: PesticideNoticeSchema = z.object({
  id: z.string(),
  application_id: z.number(),
  comtrs: z.string(),
  county: pesticideRegionSchema,
  point: z.nullable(geoJSONPointSchema),
  scheduled_application: z.string(),
  treated_amount: z.nullable(z.number()),
  treated_units: z.string(),
  application_method: z.string(),
  chemicals: z.array(chemicalSchema),
  products: z.array(productSchema),
});
